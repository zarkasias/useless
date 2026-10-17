import 'package:flutter/material.dart';

class StatDivider extends StatelessWidget {
  const StatDivider({super.key, required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 74,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: color,
    );
  }
}
