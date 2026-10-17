import 'package:timezone/timezone.dart' as tz;

String getToday(String timezone) {
  try {
    final location = tz.getLocation(timezone);
    final now = tz.TZDateTime.now(location);

    return _formatDate(now);
  } catch (_) {
    final now = tz.TZDateTime.now(tz.UTC);

    return _formatDate(now);
  }
}

String addDays(String date, int days) {
  final parts = date.split('-');

  if (parts.length != 3) {
    throw FormatException('Invalid date: $date');
  }

  final value = DateTime.utc(
    int.parse(parts[0]),
    int.parse(parts[1]),
    int.parse(parts[2]),
  );

  final result = value.add(Duration(days: days));

  return _formatDate(result);
}

String _formatDate(DateTime date) {
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');

  return '$year-$month-$day';
}
