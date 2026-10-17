import 'package:flutter/material.dart';

import 'login_view.dart';
import 'signup_view.dart';

enum AuthMode { login, signup }

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  AuthMode _mode = AuthMode.login;

  void _showLogin() {
    setState(() {
      _mode = AuthMode.login;
    });
  }

  void _showSignup() {
    setState(() {
      _mode = AuthMode.signup;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: switch (_mode) {
            AuthMode.login => LoginView(onShowSignup: _showSignup),
            AuthMode.signup => SignupView(onShowLogin: _showLogin),
          },
        ),
      ),
    );
  }
}
