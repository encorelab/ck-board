import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SnackBarComponent } from '../components/snackbar/snackbar.component';

export interface SnackbarConfig {
  matSnackbarConfig?: MatSnackBarConfig;
  action?: Action;
}

export interface Action {
  name: string;
  run: Function;
}

export interface SnackBarQueueItem {
  title: string;
  description: string;
  configParams: SnackbarConfig;
}

@Injectable({
  providedIn: 'root',
})
export class SnackbarService implements OnDestroy {
  private readonly snackBarQueue = new BehaviorSubject<SnackBarQueueItem[]>([]);
  private readonly snackBarQueue$ = this.snackBarQueue.asObservable();

  constructor(private snackBar: MatSnackBar) {
    let alreadyDismissed = false;

    this.snackBarQueue$.subscribe((e) => {
      if (!alreadyDismissed && this.snackBar._openedSnackBarRef) {
        this.snackBar.dismiss();
      }
      alreadyDismissed = false;

      const nextIndex = e.length - 1;
      if (nextIndex >= 0) {
        const next = e[nextIndex];
        this.openSnackbar(next);
        this.snackBar._openedSnackBarRef
          ?.afterDismissed()
          .subscribe((close) => {
            if (close.dismissedByAction) {
              alreadyDismissed = true;
              this.dequeueSnackbar();
            }
          });
      }
    });
  }

  queueSnackbar(
    title: string,
    description = '',
    configParams: SnackbarConfig = {}
  ) {
    this.snackBarQueue.next(
      this.snackBarQueue.value.concat([{ title, description, configParams }])
    );
  }

  dequeueSnackbar() {
    this.snackBarQueue.value.pop();
    this.snackBarQueue.next(this.snackBarQueue.value);
  }

  snackbarIsOpen(): boolean {
    return Boolean(this.snackBar._openedSnackBarRef);
  }

  private openSnackbar(item: SnackBarQueueItem) {
    const config = item.configParams.matSnackbarConfig ?? {};
    config.data = {
      title: item.title,
      description: item.description,
      action: item.configParams.action,
      close: () => this.snackBar._openedSnackBarRef?.dismissWithAction(),
    };

    this.snackBar.openFromComponent(SnackBarComponent, config);
  }

  ngOnDestroy(): void {
    this.snackBarQueue.next([]);
  }
}
