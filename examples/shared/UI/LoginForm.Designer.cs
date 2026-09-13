using System;
using System.Drawing;
using System.Windows.Forms;

namespace Polesie
{
    partial class LoginForm
    {
        private System.Windows.Forms.FlowLayoutPanel layout;
        private System.Windows.Forms.Label titleLabel;
        private System.Windows.Forms.Label loginLabel;
        private System.Windows.Forms.TextBox login;
        private System.Windows.Forms.Label passwordLabel;
        private System.Windows.Forms.TextBox password;
        private System.Windows.Forms.Label puzzleLabel;
        private System.Windows.Forms.Panel puzzleHost;
        private System.Windows.Forms.Button enter;

        private void InitializeComponent()
        {
            this.SuspendLayout();
            this.layout = new System.Windows.Forms.FlowLayoutPanel();
            this.layout.Name = "layout";
            this.layout.Dock = DockStyle.Fill;
            this.layout.FlowDirection = FlowDirection.TopDown;
            this.layout.WrapContents = false;
            this.layout.Padding = new Padding(28);
            this.layout.AutoScroll = true;
            this.titleLabel = new System.Windows.Forms.Label();
            this.titleLabel.Name = "titleLabel";
            this.titleLabel.Text = "Молочный комбинат «Полесье»";
            this.titleLabel.AutoSize = true;
            this.titleLabel.Font = new Font("Segoe UI", 20, FontStyle.Bold);
            this.loginLabel = new System.Windows.Forms.Label();
            this.loginLabel.Name = "loginLabel";
            this.loginLabel.Text = "Логин";
            this.loginLabel.AutoSize = true;
            this.login = new System.Windows.Forms.TextBox();
            this.login.Name = "login";
            this.login.Width = 300;
            this.login.MaxLength = 64;
            this.login.TabIndex = 0;
            this.passwordLabel = new System.Windows.Forms.Label();
            this.passwordLabel.Name = "passwordLabel";
            this.passwordLabel.Text = "Пароль";
            this.passwordLabel.AutoSize = true;
            this.password = new System.Windows.Forms.TextBox();
            this.password.Name = "password";
            this.password.Width = 300;
            this.password.MaxLength = 256;
            this.password.UseSystemPasswordChar = true;
            this.password.TabIndex = 1;
            this.puzzleLabel = new System.Windows.Forms.Label();
            this.puzzleLabel.Name = "puzzleLabel";
            this.puzzleLabel.Text = "Соберите изображение, затем нажмите «Войти»";
            this.puzzleLabel.AutoSize = true;
            this.puzzleLabel.Margin = new Padding(3,18,3,8);
            this.puzzleHost = new System.Windows.Forms.Panel();
            this.puzzleHost.Name = "puzzleHost";
            this.puzzleHost.TabIndex = 2;
            this.puzzleHost.Size = new Size(450,236);
            this.puzzleHost.BorderStyle = BorderStyle.FixedSingle;
            this.enter = new System.Windows.Forms.Button();
            this.enter.Name = "enter";
            this.enter.Text = "Войти";
            this.enter.Size = new Size(150,40);
            this.enter.BackColor = Color.FromArgb(210,32,46);
            this.enter.ForeColor = Color.White;
            this.enter.FlatStyle = FlatStyle.Flat;
            this.enter.TabIndex = 3;
            this.layout.Controls.Add(this.titleLabel);
            this.layout.Controls.Add(this.loginLabel);
            this.layout.Controls.Add(this.login);
            this.layout.Controls.Add(this.passwordLabel);
            this.layout.Controls.Add(this.password);
            this.layout.Controls.Add(this.puzzleLabel);
            this.layout.Controls.Add(this.puzzleHost);
            this.layout.Controls.Add(this.enter);
            this.enter.Click += new EventHandler(this.SignIn);
            this.AcceptButton = this.enter;
            this.Controls.Add(this.layout);
            this.Text = "Молочный комбинат «Полесье» — вход";
            this.MinimumSize = new Size(660,570);
            this.Size = new Size(720,640);
            this.Font = new Font("Segoe UI",10);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.ResumeLayout(false);
        }
    }
}
