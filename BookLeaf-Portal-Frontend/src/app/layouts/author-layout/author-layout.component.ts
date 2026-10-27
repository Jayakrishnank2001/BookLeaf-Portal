import { Component, signal, inject, computed } from '@angular/core';
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
    selector: 'app-author-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
    templateUrl: './author-layout.component.html',
    styleUrls: ['./author-layout.component.css'],
})

export class AuthorLayoutComponent {
    private auth = inject(AuthService);
    private router = inject(Router);
    private notify = inject(NotificationService);
    realtime = inject(RealtimeService);
    mobileOpen = signal(false);
    user = this.auth.currentUser();
    nav: NavItem[] = [
        { label: 'Dashboard', route: '/author/dashboard', icon: 'dashboard', exact: true },
        { label: 'My Books', route: '/author/books', icon: 'book' },
        { label: 'My Tickets', route: '/author/tickets', icon: 'ticket' },
        { label: 'Submit Query', route: '/author/tickets/new', icon: 'plus' },
    ];
    
    bell() {
        this.notify.info('You have no new notifications.');
    }
    
    logout() {
        this.auth.logout();
        this.notify.success('Signed out successfully.');
        this.router.navigate(['/login']);
    }
}