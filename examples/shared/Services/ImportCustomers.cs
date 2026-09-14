using System;
using System.Collections.Generic;
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
            var serializer = new JavaScriptSerializer();
            object[] rows = serializer.DeserializeObject(json) as object[];
            if (rows == null) throw new InvalidOperationException("Ожидался массив заказчиков JSON.");
            var customers = new Counterparty[rows.Length];
            var ids = new HashSet<string>(StringComparer.Ordinal);
            for (int i = 0; i < rows.Length; i++)
            {
                var row = rows[i] as Dictionary<string, object>;
                if (row == null) throw new InvalidOperationException("Заказчик должен быть объектом JSON. Импорт отменён.");
                foreach (string field in new[] { "id", "name", "inn", "addres", "phone", "salesman", "buyer" })
                    if (!row.ContainsKey(field)) throw new InvalidOperationException("Отсутствует поле " + field + ". Выберите полный файл заказчиков. Импорт отменён.");
                foreach (string field in new[] { "id", "name", "inn", "addres", "phone" })
                    if (row[field] != null && !(row[field] is string)) throw new InvalidOperationException("Поле " + field + " должно быть текстом. Импорт отменён.");
                if (!(row["salesman"] is bool) || !(row["buyer"] is bool))
                    throw new InvalidOperationException("Признаки salesman и buyer должны быть true или false. Импорт отменён.");
                var customer = serializer.ConvertToType<Counterparty>(row);
                if (String.IsNullOrWhiteSpace(customer.id) || String.IsNullOrWhiteSpace(customer.name) || !ids.Add(customer.id))
                    throw new InvalidOperationException("Проверьте id и name: пустые значения и повторяющиеся id недопустимы. Импорт отменён.");
                customers[i] = customer;
            }
            using (DbConnection connection = Db.Open())
            using (DbTransaction transaction = connection.BeginTransaction())
            {
                Users.RequireAdmin(connection, transaction, actorId);
                foreach (Counterparty customer in customers)
                {
                    int count = Db.Count(connection, transaction, "SELECT COUNT(*) FROM counterparty WHERE id=@p0", customer.id);
                    string sql = count == 0
                        ? "INSERT INTO counterparty(name,inn,address,phone,is_salesman,is_buyer,id) VALUES(@p0,@p1,@p2,@p3,@p4,@p5,@p6)"
                        : "UPDATE counterparty SET name=@p0,inn=@p1,address=@p2,phone=@p3,is_salesman=@p4,is_buyer=@p5 WHERE id=@p6";
                    Db.Execute(connection, transaction, sql, customer.name, customer.inn,
                        customer.addres, customer.phone, customer.salesman, customer.buyer, customer.id);
                }
                transaction.Commit();
            }
            return customers.Length;
        }
    }
}
