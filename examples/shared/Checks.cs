using System;
using System.Data;
using System.Data.Common;
using System.IO;

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
        public static int Run()
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
