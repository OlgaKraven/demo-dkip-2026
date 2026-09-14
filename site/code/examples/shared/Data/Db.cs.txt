using System;
using System.Data;
using System.Data.Common;
#if MYSQL
using MySqlConnector;
#else
using Npgsql;
#endif

namespace Polesie
{
    public static class Db
    {
#if MYSQL
        public static string ConnectionString = "Server=127.0.0.1;Port=3306;Database=rassvet_demo_2026;User ID=root;Password=;";
#else
        public static string ConnectionString = "Host=127.0.0.1;Port=5432;Database=rassvet_demo_2026;Username=postgres;Password=CHANGE_ME;";
#endif

        public static DbConnection Open()
        {
#if MYSQL
            DbConnection result = new MySqlConnection(ConnectionString);
#else
            DbConnection result = new NpgsqlConnection(ConnectionString);
#endif
            try { result.Open(); }
            catch
            {
                result.Dispose();
                throw;
            }
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
