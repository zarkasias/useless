import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:mobile/auth/auth_screen.dart';
import 'package:mobile/screens/home_screen.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  late Session? _session;
  late final StreamSubscription<AuthState> _authSubscription;
  bool _isCheckingSession = true;

  @override
  void initState() {
    super.initState();

    final auth = Supabase.instance.client.auth;

    _session = auth.currentSession;

    _authSubscription = auth.onAuthStateChange.listen((data) {
      if (!mounted) return;

      setState(() {
        _session = data.session;
        _isCheckingSession = false;
      });
    });

    _isCheckingSession = false;
  }

  @override
  void dispose() {
    _authSubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isCheckingSession) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_session == null) {
      return const AuthScreen();
    }

    return const HomeScreen();
  }
}
