// Copy this file to passwords.js and change the passwords
export const PASSWORDS = {
  ADMIN_LOGIN: 'your_admin_password_here',
  USER_LOGIN: 'your_user_password_here', 
  EDIT_PASSWORD: 'your_edit_password_here'
};

export const USERS = {
  admin: { password: PASSWORDS.ADMIN_LOGIN, role: 'admin' },
  user: { password: PASSWORDS.USER_LOGIN, role: 'user' }
};