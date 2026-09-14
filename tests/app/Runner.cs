using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace Polesie
{
    internal static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            string connection = Environment.GetEnvironmentVariable("DEMO_CONNECTION");
            if (!String.IsNullOrWhiteSpace(connection)) Db.ConnectionString = connection;
            if (args.Length > 0 && args[0] == "--logic-test") return Checks.Run(false);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            if (args.Length > 0 && args[0] == "--test") return Checks.Run();
            if (args.Length > 0 && args[0] == "--screenshots")
            {
                Directory.CreateDirectory(args[1]);
                using (var form = new LoginForm()) Capture(form, Path.Combine(args[1], "login.png"));
                User admin = AuthService.SignIn("admin", "DemoAdmin!2026", true);
                using (var form = new MainForm(admin))
                {
                    Capture(form, Path.Combine(args[1], "customers.png"));
                    form.SelectPage(1);
                    Capture(form, Path.Combine(args[1], "costs.png"));
                    form.SelectPage(2);
                    Capture(form, Path.Combine(args[1], "users.png"));
                }
                return 0;
            }
            Application.Run(new LoginForm());
            return 0;
        }

        private static void Capture(Form form, string filename)
        {
            form.ShowInTaskbar = false;
            form.StartPosition = FormStartPosition.Manual;
            form.Location = new Point(-20000, -20000);
            form.Show();
            Application.DoEvents();
            using (var bitmap = new Bitmap(form.Width, form.Height))
            {
                form.DrawToBitmap(bitmap, new Rectangle(Point.Empty, form.Size));
                bitmap.Save(filename);
            }
        }
    }
}
