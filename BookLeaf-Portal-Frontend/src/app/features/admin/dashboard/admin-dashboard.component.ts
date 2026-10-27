import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminTicketService, TicketActivityPoint } from '../../../core/services/admin-ticket.service';
import { Ticket } from '../../../core/models/models';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

interface Metric {
  label: string;
  value: number;
  icon: IconName;
  accent: string;
  bg: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, BadgeComponent, TimeAgoPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  private adminSvc = inject(AdminTicketService);

  activityLoading = signal(true);
  ticketsLoading = signal(true);
  activity = signal<TicketActivityPoint[]>([]);
  recentTickets = signal<Ticket[]>([]);
  maxActivity = computed(() => Math.max(...this.activity().map((p) => p.count), 1));

  metrics = computed<Metric[]>(() => {
    const m = this.adminSvc.getMetrics();
    return [
      { label: 'Open tickets', value: m.open, icon: 'ticket', accent: 'var(--color-info)', bg: 'var(--color-info-50)' },
      { label: 'Critical', value: m.critical, icon: 'alert', accent: 'var(--color-critical)', bg: 'var(--color-critical-50)' },
      { label: 'High priority', value: m.high, icon: 'flag', accent: 'var(--color-high)', bg: 'var(--color-high-50)' },
      { label: 'Unassigned', value: m.unassigned, icon: 'users', accent: 'var(--color-warning)', bg: 'var(--color-warning-50)' },
      { label: 'Resolved today', value: m.resolvedToday, icon: 'check', accent: 'var(--color-success)', bg: 'var(--color-success-50)' },
    ];
  });

  priorityBreakdown = computed(() => {
    const m = this.adminSvc.getMetrics();
    const all = m.open + m.inProgress + m.critical + m.high;
    const total = Math.max(all, 1);
    return [
      { label: 'Critical', count: m.critical, color: 'var(--color-critical)', pct: (m.critical / total) * 100 },
      { label: 'High', count: m.high, color: 'var(--color-high)', pct: (m.high / total) * 100 },
      { label: 'Medium', count: 2, color: 'var(--color-medium)', pct: (2 / total) * 100 },
      { label: 'Low', count: 1, color: 'var(--color-low)', pct: (1 / total) * 100 },
    ];
  });

  xLabels = computed(() => {
    const a = this.activity();
    return a.filter((_, i) => i % 2 === 0).map((p) => new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  });

  barHeight(count: number): number {
    return Math.max(6, Math.round((count / this.maxActivity()) * 100));
  }

  ngOnInit() {
    this.adminSvc.getActivity().subscribe((a) => { this.activity.set(a); this.activityLoading.set(false); });
    this.adminSvc.getTickets().subscribe((t) => {
      this.recentTickets.set(t.slice(0, 5));
      this.ticketsLoading.set(false);
    });
  }
}