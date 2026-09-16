namespace PolesieTraining
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;
        protected override void Dispose(bool disposing)
        {
            if (disposing && components != null) components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.loginLabel = new System.Windows.Forms.Label();
            this.login = new System.Windows.Forms.TextBox();
            this.passwordLabel = new System.Windows.Forms.Label();
            this.password = new System.Windows.Forms.TextBox();
            this.enter = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // loginLabel
            this.loginLabel.Location = new System.Drawing.Point(32, 28);
            this.loginLabel.Name = "loginLabel";
            this.loginLabel.Size = new System.Drawing.Size(53, 21);
            this.loginLabel.TabIndex = 0;
            this.loginLabel.Text = "Логин";
            this.loginLabel.AutoSize = true;
            // login
            this.login.Location = new System.Drawing.Point(32, 56);
            this.login.Name = "login";
            this.login.Size = new System.Drawing.Size(332, 29);
            this.login.TabIndex = 1;


            // passwordLabel
            this.passwordLabel.Location = new System.Drawing.Point(32, 104);
            this.passwordLabel.Name = "passwordLabel";
            this.passwordLabel.Size = new System.Drawing.Size(67, 21);
            this.passwordLabel.TabIndex = 2;
            this.passwordLabel.Text = "Пароль";
            this.passwordLabel.AutoSize = true;
            // password
            this.password.Location = new System.Drawing.Point(32, 132);
            this.password.Name = "password";
            this.password.Size = new System.Drawing.Size(332, 29);
            this.password.TabIndex = 3;


            // enter
            this.enter.Location = new System.Drawing.Point(32, 192);
            this.enter.Name = "enter";
            this.enter.Size = new System.Drawing.Size(332, 42);
            this.enter.TabIndex = 4;
            this.enter.Text = "Войти";

            this.password.UseSystemPasswordChar = true;
            this.enter.UseVisualStyleBackColor = true;
            this.enter.Click += new System.EventHandler(this.enter_Click);
            // Form1
            this.AcceptButton = this.enter;
            this.AutoScaleDimensions = new System.Drawing.SizeF(9F, 21F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(400, 270);
            this.Controls.Add(this.loginLabel);
            this.Controls.Add(this.login);
            this.Controls.Add(this.passwordLabel);
            this.Controls.Add(this.password);
            this.Controls.Add(this.enter);
            this.Font = new System.Drawing.Font("Segoe UI", 12F);
            this.Name = "Form1";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Полесье — вход";
            this.ResumeLayout(false);
            this.PerformLayout();
        }
        private System.Windows.Forms.Label loginLabel;
        private System.Windows.Forms.TextBox login;
        private System.Windows.Forms.Label passwordLabel;
        private System.Windows.Forms.TextBox password;
        private System.Windows.Forms.Button enter;
    }
}
