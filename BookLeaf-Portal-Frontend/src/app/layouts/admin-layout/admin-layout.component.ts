import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

interface NavItem {
    label: string;
    route: string;
    icon: IconName;
    exact?: boolean;
}

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.css'],
})

export class AdminLayoutComponent {
    private auth = inject(AuthService);
    private router = inject(Router);
    private notify = inject(NotificationService);
    realtime = inject(RealtimeService);
    mobileOpen = signal(false);
    user = this.auth.currentUser();
    nav: NavItem[] = [
        {
            label: 'Overview',
            route: '/admin/dashboard',
            icon: 'dashboard',
            exact: true
        },
        {
            label: 'Ticket Queue',
            route: '/admin/tickets',
            icon: 'ticket'
        },
        {
            label: 'My Assigned',
            route: '/admin/tickets?assigned=me',
            icon: 'list'
        },
        {
            label: 'Analytics',
            route: '/admin/dashboard#analytics',
            icon: 'activity'
        },
        {
            label: 'Settings',
            route: '/admin/dashboard#settings',
            icon: 'settings'
        },];

    logout() {
        this.auth.logout();
        this.notify.success('Signed out successfully.');
        this.router.navigate(['/login']);
    }
}