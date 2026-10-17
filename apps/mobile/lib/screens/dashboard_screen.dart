import 'package:flutter/material.dart';
import 'package:mobile/widgets/stat_card.dart';
import 'package:mobile/widgets/recent_achievements.dart';
import 'package:mobile/design/design_tokens.g.dart';
import 'package:mobile/widgets/stat_divider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:mobile/models/dashboard_data.dart';
import 'package:mobile/services/dashboard_service.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final DashboardService _dashboardService;
  late Future<DashboardData> _dashboardFuture;

  @override
  void initState() {
    super.initState();

    _dashboardService = DashboardService(Supabase.instance.client);

    _dashboardFuture = _dashboardService.getDashboardData();
  }

  Future<void> _refreshDashboard() async {
    final future = _dashboardService.getDashboardData();

    setState(() {
      _dashboardFuture = future;
    });

    await future;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: FutureBuilder<DashboardData>(
          future: _dashboardFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.cloud_off_outlined,
                        size: 40,
                        color: colors.onSurfaceVariant,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Unable to load your dashboard.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _refreshDashboard,
                        child: const Text('Try again'),
                      ),
                    ],
                  ),
                ),
              );
            }

            final data = snapshot.data!;

            final formattedToday = DateFormat('MMM d')
                .format(DateTime.parse(data.today));

            return RefreshIndicator(
              onRefresh: _refreshDashboard,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                children: [
                  // Header
                  Text(
                    'Welcome back',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 2),

                  Text(
                    data.username,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                    ),
                  ),

                  const SizedBox(height: 6),

                  Text(
                    'Keep your streak alive, grow your collection, and continue accomplishing absolutely nothing useful.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.4,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Today's achievement
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          colors.primary.withValues(alpha: 0.10),
                          colors.secondary.withValues(alpha: 0.05),
                        ],
                      ),
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(18),
                        topRight: Radius.circular(18),
                      ),
                      border: Border.all(
                        color: colors.primary.withValues(alpha: 0.18),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: colors.primary.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.today_outlined,
                                size: 15,
                                color: colors.primary,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                'Today - $formattedToday',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: colors.primary,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        Text(
                          data.claimedToday
                              ? 'Your daily nonsense is complete'
                              : 'Today\'s achievement is waiting',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            height: 1.15,
                          ),
                        ),

                        const SizedBox(height: 8),

                        Text(
                          data.claimedToday
                              ? 'Today\'s useless achievement is safely in your collection.'
                              : 'Claim one new achievement today and keep your streak alive.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: colors.onSurfaceVariant,
                            height: 1.4,
                          ),
                        ),

                        if (data.claimedToday) ...[
                          const SizedBox(height: 18),

                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 9,
                            ),
                            decoration: BoxDecoration(
                              color: colors.surface.withValues(alpha: 0.75),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.check_circle_outline,
                                  size: 18,
                                  color: colors.primary,
                                ),
                                const SizedBox(width: 7),
                                Text(
                                  'Achievement claimed',
                                  style: theme.textTheme.labelLarge?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Stats
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: AchievementCardTokens.dashboardStats,
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(18),
                        bottomRight: Radius.circular(18),
                      ),
                      border: Border.all(
                        color: AchievementCardTokens.dashboardStats,
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: StatCard(
                            icon: Icons.local_fire_department,
                            iconColor: Colors.orange,
                            value: data.currentStreak.toString(),
                            label: 'Current Streak',
                          ),
                        ),

                        StatDivider(color: Colors.white),

                        Expanded(
                          child: StatCard(
                            icon: Icons.emoji_events_outlined,
                            iconColor: Colors.amber,
                            value: data.longestStreak.toString(),
                            label: 'Best Streak',
                          ),
                        ),

                        StatDivider(color: Colors.white),

                        Expanded(
                          child: StatCard(
                            icon: Icons.workspace_premium_outlined,
                            iconColor: Colors.lightBlue,
                            value: data.totalAchievements.toString(),
                            label: 'Total Achievements',
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 18),

                  RecentAchievements(
                    achievements: data.recentAchievements,
                    onViewCollection: () {
                      // to be added
                    },
                  ),

                  const SizedBox(height: 16),

                  // We will add the recent achievement cards next.
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
