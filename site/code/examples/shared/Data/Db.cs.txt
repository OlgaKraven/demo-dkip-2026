using System;
using System.Data;
using System.Data.Common;
using System.IO;
#if MYSQL
using MySqlConnector;
#else
using Npgsql;
#endif

namespace Polesie
{
    public static class Db
    {
        public static DbConnection Open()
        {
            string connection = Environment.GetEnvironmentVariable("DEMO_CONNECTION");
            if (String.IsNullOrWhiteSpace(connection))
            {
                string file = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "connection.local.txt");
                if (!File.Exists(file))
                    throw new InvalidOperationException("Создайте connection.local.txt рядом с программой по образцу connection.example.txt.");
                connection = File.ReadAllText(file).Trim();
            }
#if MYSQL
            DbConnection result = new MySqlConnection(connection);
#else
            DbConnection result = new NpgsqlConnection(connection);
#endif
            result.Open();
            return result;
        }

        public static DbCommand Command(DbConnection connection, string sql, params object[] values)
        {
            DbCommand command = connection.CreateCommand();
            command.CommandText = sql;
            for (int i = 0; i < values.Length; i++)
            {
                DbParameter parameter = command.CreateParameter();
                parameter.ParameterName = "@p" + i;
                parameter.Value = values[i] ?? DBNull.Value;
                command.Parameters.Add(parameter);
            }
            return command;
        }

        public static int Execute(DbConnection connection, DbTransaction transaction, string sql, params object[] values)
        {
            using (DbCommand command = Command(connection, sql, values))
            {
                command.Transaction = transaction;
                return command.ExecuteNonQuery();
            }
        }

        public static int Count(DbConnection connection, DbTransaction transaction, string sql, params object[] values)
        {
            using (DbCommand command = Command(connection, sql, values))
            {
                command.Transaction = transaction;
                return Convert.ToInt32(command.ExecuteScalar());
            }
        }

        public static DataTable Table(string sql, params object[] values)
        {
            using (DbConnection connection = Open())
            using (DbCommand command = Command(connection, sql, values))
            using (DbDataReader reader = command.ExecuteReader())
            {
                DataTable table = new DataTable();
                table.Load(reader);
                return table;
            }
        }
    }
}
