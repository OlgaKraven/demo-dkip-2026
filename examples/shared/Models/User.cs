namespace Polesie
{
    public class User
    {
        public int Id { get; set; }
        public string Login { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; }
        public int FailedAttempts { get; set; }
        public bool IsLocked { get; set; }
    }
}
