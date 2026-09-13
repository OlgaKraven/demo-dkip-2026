using System;
using System.Data.Common;

namespace Polesie
{
    public static class Users
    {
        public static void RequireAdmin(DbConnection connection, DbTransaction transaction, int actorId)
        {
            if (Db.Count(connection, transaction,
                "SELECT COUNT(*) FROM users WHERE id=@p0 AND role='admin' AND is_locked=@p1", actorId, false) != 1)
                throw new InvalidOperationException("Для этого действия нужны права администратора.");
        }

        public static void Save(int actorId, int id, string login, string password, string role, bool unlock)
        {
            login = login.Trim().ToLowerInvariant();
            if (login.Length < 1 || login.Length > 64 || (id == 0 && password.Length == 0))
                throw new InvalidOperationException("Введите логин (до 64 символов) и пароль нового пользователя.");
            if (role != "admin" && role != "user") throw new InvalidOperationException("Выберите роль.");
            if (actorId == id && role != "admin") throw new InvalidOperationException("Нельзя снять с себя роль администратора.");
            using (DbConnection connection = Db.Open())
            using (DbTransaction transaction = connection.BeginTransaction())
            {
                RequireAdmin(connection, transaction, actorId);
                if (Db.Count(connection, transaction,
                    "SELECT COUNT(*) FROM users WHERE login=@p0 AND id<>@p1", login, id) > 0)
                    throw new InvalidOperationException("Пользователь с таким логином уже существует.");
                string hash = password.Length == 0 ? "" : Passwords.Hash(password);
                if (id == 0)
                    Db.Execute(connection, transaction,
                        "INSERT INTO users(login,password_hash,role) VALUES(@p0,@p1,@p2)", login, hash, role);
                else
                {
                    int updated = Db.Execute(connection, transaction,
                        "UPDATE users SET login=@p0,password_hash=CASE WHEN @p1='' THEN password_hash ELSE @p1 END,role=@p2 WHERE id=@p3",
                        login, hash, role, id);
                    if (updated == 0) throw new InvalidOperationException("Пользователь не найден. Обновите таблицу.");
                    if (unlock)
                        Db.Execute(connection, transaction,
                            "UPDATE users SET is_locked=@p0,failed_attempts=0 WHERE id=@p1", false, id);
                }
                transaction.Commit();
            }
        }
    }
}
