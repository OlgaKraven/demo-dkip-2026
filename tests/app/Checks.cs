using System;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Windows.Forms;
using System.Reflection;
using System.Web.Script.Serialization;

namespace Polesie
{
    internal static class Checks
    {
        private static int count;
        private static void Assert(bool condition, string name)
        {
            if (!condition) throw new Exception("FAIL: " + name);
            count++;
        }
        private static void Fails(Action action, string message)
        {
            try { action(); }
            catch (InvalidOperationException e) { Assert(e.Message.Contains(message), message); return; }
            throw new Exception("Ожидалась ошибка: " + message);
        }
        private static object ChangedCost(string change, string sql)
        {
            using (DbConnection connection = Db.Open())
            using (DbTransaction transaction = connection.BeginTransaction())
            {
                using (DbCommand update = Db.Command(connection, change))
                {
                    update.Transaction = transaction;
                    update.ExecuteNonQuery();
                }
                object value;
                using (DbCommand query = Db.Command(connection, sql))
                {
                    query.Transaction = transaction;
                    using (DbDataReader reader = query.ExecuteReader())
                    {
                        reader.Read();
                        value = reader["material_cost"];
                    }
                }
                transaction.Rollback();
                return value;
            }
        }
        private static void Rejects(string sql, string name)
        {
            using (DbConnection connection = Db.Open())
            using (DbTransaction transaction = connection.BeginTransaction())
            {
                try { Db.Execute(connection, transaction, sql); }
                catch (DbException) { transaction.Rollback(); Assert(true,name); return; }
                transaction.Rollback();
                throw new Exception("Constraint was not enforced: "+name);
            }
        }
        public static int Run(bool checkForms = true)
        {
            try
            {
                string sql = File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"Sql","04-cost.sql"));
                DataTable costs = Db.Table(sql);
                decimal[] expected = { 371m, 126.45m, 183.95m };
                for (int i=0;i<3;i++) Assert(Convert.ToDecimal(costs.Rows[i]["material_cost"])==expected[i],"cost "+i);
                Assert(ChangedCost("DELETE FROM price WHERE item_id=1",sql)==DBNull.Value,"missing price is not zero");
                Assert(Convert.ToDecimal(ChangedCost("UPDATE specification SET output_qty=2 WHERE id=1",sql))==261.25m,"batch output quantity");
                Assert(ChangedCost("DELETE FROM specification_material WHERE specification_id=1",sql)==DBNull.Value,"missing composition");
                string hash = Passwords.Hash("test");
                Assert(Passwords.Verify("test",hash),"hash");
                Assert(!Passwords.Verify("wrong",hash),"wrong password");
                Assert(!Passwords.Verify("test","invalid"),"invalid hash");
                User admin = AuthService.SignIn("ADMIN", "DemoAdmin!2026", true);
                Fails(delegate { AuthService.SignIn("", "x", true); },"Заполните");
                Fails(delegate { AuthService.SignIn("admin", "", true); },"Заполните");
                Fails(delegate { AuthService.SignIn("missing", "x", true); },"неверный");
                Users.Save(admin.Id,0,"test_login","Secret!2026","user",false);
                User learner = AuthService.SignIn("test_login","Secret!2026",true);
                Fails(delegate { Users.Save(admin.Id,0,"TEST_LOGIN","x","user",false); },"уже существует");
                Fails(delegate { Users.Save(learner.Id,0,"forbidden","x","admin",false); },"права администратора");
                Fails(delegate { AuthService.SignIn("test_login","wrong",true); },"неверный");
                Fails(delegate { AuthService.SignIn("test_login","Secret!2026",false); },"Пазл");
                Fails(delegate { AuthService.SignIn("test_login","wrong",true); },"заблокированы");
                Fails(delegate { AuthService.SignIn("test_login","Secret!2026",true); },"заблокированы");
                Users.Save(admin.Id,learner.Id,"test_login","","user",true);
                Assert(AuthService.SignIn("test_login","Secret!2026",true).FailedAttempts==0,"unlock");
                Fails(delegate { AuthService.SignIn("test_login","wrong",true); },"неверный");
                Assert(AuthService.SignIn("test_login","Secret!2026",true).FailedAttempts==0,"success resets counter");
                Users.Save(admin.Id,learner.Id,"test_edited","New!2026","user",false);
                Assert(AuthService.SignIn("test_edited","New!2026",true).Login=="test_edited","edit login/password");
                string file=Environment.GetEnvironmentVariable("DEMO_IMPORT_FILE");
                int imported=ImportCustomers.Run(admin.Id,file);
                Assert(ImportCustomers.Run(admin.Id,file)==imported,"repeat import");
                DataTable row=Db.Table("SELECT id,phone,address FROM counterparty WHERE id=@p0","000000001");
                Assert((string)row.Rows[0]["id"]=="000000001","leading zeroes");
                Assert(((string)row.Rows[0]["phone"]).StartsWith("+"),"phone preserved");
                Counterparty[] source = new JavaScriptSerializer().Deserialize<Counterparty[]>(File.ReadAllText(file));
                Assert(Db.Table("SELECT * FROM counterparty").Rows.Count==source.Length,"all source customers imported");
                foreach(Counterparty customer in source)
                {
                    DataRow actual=Db.Table("SELECT * FROM counterparty WHERE id=@p0",customer.id).Rows[0];
                    Assert((string)actual["name"]==customer.name && (string)actual["inn"]==customer.inn
                        && (string)actual["address"]==customer.addres && (string)actual["phone"]==customer.phone
                        && Convert.ToBoolean(actual["is_salesman"])==customer.salesman
                        && Convert.ToBoolean(actual["is_buyer"])==customer.buyer,"JSON record "+customer.id);
                }
                Fails(delegate { ImportCustomers.Run(learner.Id,file); },"права администратора");
                Rejects("UPDATE customer_order_line SET order_id=999999 WHERE id=1","foreign key");
                Rejects("UPDATE customer_order_line SET qty=0 WHERE id=1","positive quantity");
                Rejects("UPDATE users SET login='admin' WHERE login='user'","unique login");
                Rejects("UPDATE counterparty SET id='000000001' WHERE id='000000002'","primary key");
                Fails(delegate { AuthService.SignIn("test_edited","wrong",false); }, AuthService.Wrong);
                Assert(Convert.ToInt32(Db.Table("SELECT failed_attempts FROM users WHERE id=@p0",learner.Id).Rows[0][0])==1,"two wrong factors count once");
                AuthService.SignIn("test_edited","New!2026",true);
                Fails(delegate { Users.Save(admin.Id,999999,"absent","","user",false); },"не найден");
                Users.Save(admin.Id,learner.Id,"test_edited","","user",false);
                Assert(AuthService.SignIn("test_edited","New!2026",true).Login=="test_edited","unchanged edit preserves password");
                string invalid=Path.GetTempFileName();
                File.WriteAllText(invalid,"[{\"id\":\"audit_rollback\",\"name\":\"Temporary\"},null]");
                try
                {
                    Fails(delegate { ImportCustomers.Run(admin.Id,invalid); },"Импорт отменён");
                    Assert(Convert.ToInt32(Db.Table("SELECT COUNT(*) FROM counterparty WHERE id=@p0","audit_rollback").Rows[0][0])==0,"invalid import rolls back all rows");
                }
                finally { File.Delete(invalid); }
                if (checkForms)
                {
                    using(var form=new LoginForm())
                    {
                        Assert(((TextBox)form.Controls.Find("password",true)[0]).UseSystemPasswordChar,"password masked");
                        Assert(form.AcceptButton==form.Controls.Find("enter",true)[0],"enter key signs in");
                        Assert(form.MinimumSize.Width>0&&form.MinimumSize.Height>0,"minimum form size");
                    }
                    using(var form=new MainForm(admin))
                    {
                        Assert(((TabControl)form.Controls.Find("tabs",true)[0]).TabPages.Count==3,"admin sees all three tabs");
                        Assert(((DataGridView)form.Controls.Find("users",true)[0]).Dock==DockStyle.Fill,"users grid resizes");
                    }
                    using(var form=new MainForm(learner))
                        Assert(((TabControl)form.Controls.Find("tabs",true)[0]).TabPages.Count==2,"user cannot see admin page");
                    using(var puzzle=new PuzzleControl())
                    {
                        Assert(!puzzle.IsSolved(),"puzzle starts shuffled");
                        var order=(int[])typeof(PuzzleControl).GetField("order",BindingFlags.NonPublic|BindingFlags.Instance).GetValue(puzzle);
                        var select=typeof(PuzzleControl).GetMethod("SelectTile",BindingFlags.NonPublic|BindingFlags.Instance);
                        for(int i=0;i<4;i++)if(order[i]!=i)
                        {
                            int other=Array.IndexOf(order,i);
                            select.Invoke(puzzle,new object[]{i});
                            select.Invoke(puzzle,new object[]{other});
                        }
                        Assert(puzzle.IsSolved(),"tile exchanges solve puzzle");
                        puzzle.Shuffle();
                        Assert(!puzzle.IsSolved(),"new puzzle is not already solved");
                    }
                }
                using(DbConnection connection=Db.Open())
                using(DbCommand command=Db.Command(connection,"DELETE FROM users WHERE id=@p0",learner.Id)) command.ExecuteNonQuery();
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"test-result.txt"),"PASS: "+count+" checks; costs 371.00 / 126.45 / 183.95; customers "+imported);
                return 0;
            }
            catch(Exception e)
            {
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"test-result.txt"),e.ToString());
                return 1;
            }
        }
    }
}
