using System;
using System.Data.Common;

namespace Polesie
{
    public static class AuthService
    {
        public const string Wrong = "Вы ввели неверный логин или пароль. Пожалуйста проверьте ещё раз введенные данные";
        public const string Locked = "Вы заблокированы. Обратитесь к администратору";

        public static User SignIn(string login, string password, bool puzzleSolved)
        {
            login = login.Trim().ToLowerInvariant();
            if (login.Length == 0 || password.Length == 0)
                throw new InvalidOperationException("Заполните логин и пароль.");
            using (DbConnection connection = Db.Open())
            using (DbTransaction transaction = connection.BeginTransaction())
            {
                User user = null;
                using (DbCommand command = Db.Command(connection,
                    "SELECT id,login,password_hash,role,failed_attempts,is_locked FROM users WHERE login=@p0 FOR UPDATE", login))
                {
                    command.Transaction = transaction;
                    using (DbDataReader reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                            user = new User { Id = Convert.ToInt32(reader[0]), Login = (string)reader[1],
                                PasswordHash = (string)reader[2], Role = (string)reader[3],
                                FailedAttempts = Convert.ToInt32(reader[4]), IsLocked = Convert.ToBoolean(reader[5]) };
                    }
                }
                if (user == null) throw new InvalidOperationException(Wrong);
                if (user.IsLocked) throw new InvalidOperationException(Locked);
                bool passwordCorrect = Passwords.Verify(password, user.PasswordHash);
                bool accepted = puzzleSolved && passwordCorrect;
                int attempts = accepted ? 0 : user.FailedAttempts + 1;
                bool locked = attempts >= 3;
                Db.Execute(connection, transaction,
                    "UPDATE users SET failed_attempts=@p0,is_locked=@p1 WHERE id=@p2", attempts, locked, user.Id);
                transaction.Commit();
                if (locked) throw new InvalidOperationException(Locked);
                if (!passwordCorrect) throw new InvalidOperationException(Wrong);
                if (!puzzleSolved)
                    throw new InvalidOperationException("Пазл собран неверно. Осталось попыток: " + (3 - attempts));
                user.FailedAttempts = 0;
                return user;
            }
        }
    }
}
