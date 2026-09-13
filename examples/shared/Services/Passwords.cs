using System;
using System.Security.Cryptography;

namespace Polesie
{
    public static class Passwords
    {
        public static string Hash(string password)
        {
            byte[] salt = new byte[16];
            using (RandomNumberGenerator random = RandomNumberGenerator.Create())
                random.GetBytes(salt);
            using (var derive = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256))
                return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(derive.GetBytes(32));
        }

        public static bool Verify(string password, string stored)
        {
            try
            {
                string[] parts = stored.Split(':');
                if (parts.Length != 2) return false;
                byte[] expected = Convert.FromBase64String(parts[1]);
                using (var derive = new Rfc2898DeriveBytes(password, Convert.FromBase64String(parts[0]), 100000, HashAlgorithmName.SHA256))
                {
                    byte[] actual = derive.GetBytes(32);
                    if (expected.Length != actual.Length) return false;
                    int difference = 0;
                    for (int i = 0; i < actual.Length; i++)
                        difference |= actual[i] ^ expected[i];
                    return difference == 0;
                }
            }
            catch (FormatException) { return false; }
            catch (ArgumentException) { return false; }
        }
    }
}
