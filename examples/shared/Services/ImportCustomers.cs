using System;
using System.Data.Common;
using System.IO;
using System.Web.Script.Serialization;

namespace Polesie
{
    public static class ImportCustomers
    {
        public static int Run(int actorId, string filename)
        {
            string json = File.ReadAllText(filename);
            Counterparty[] customers = new JavaScriptSerializer().Deserialize<Counterparty[]>(json);
            if (customers == null) throw new InvalidOperationException("Ожидался массив заказчиков JSON.");
            using (DbConnection connection = Db.Open())
            using (DbTransaction transaction = connection.BeginTransaction())
            {
                Users.RequireAdmin(connection, transaction, actorId);
                foreach (Counterparty customer in customers)
                {
                    if (String.IsNullOrWhiteSpace(customer.id) || String.IsNullOrWhiteSpace(customer.name))
                        throw new InvalidOperationException("У заказчика отсутствует id или name. Импорт отменён.");
                    int count;
                    using (DbCommand check = Db.Command(connection, "SELECT COUNT(*) FROM counterparty WHERE id=@p0", customer.id))
                    {
                        check.Transaction = transaction;
                        count = Convert.ToInt32(check.ExecuteScalar());
                    }
                    string sql = count == 0
                        ? "INSERT INTO counterparty(name,inn,address,phone,is_salesman,is_buyer,id) VALUES(@p0,@p1,@p2,@p3,@p4,@p5,@p6)"
                        : "UPDATE counterparty SET name=@p0,inn=@p1,address=@p2,phone=@p3,is_salesman=@p4,is_buyer=@p5 WHERE id=@p6";
                    using (DbCommand command = Db.Command(connection, sql, customer.name, customer.inn,
                        customer.addres, customer.phone, customer.salesman, customer.buyer, customer.id))
                    {
                        command.Transaction = transaction;
                        command.ExecuteNonQuery();
                    }
                }
                transaction.Commit();
            }
            return customers.Length;
        }
    }
}
