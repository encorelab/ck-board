import { Injectable, OnDestroy } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig, MatSnackBarDismiss } from "@angular/material/snack-bar";
import { BehaviorSubject, Subject, Observable } from "rxjs";
import { filter, tap, map, takeUntil, delay, take } from "rxjs/operators";

export interface SnackBarQueueItem {
  message: string;
  configParams?: MatSnackBarConfig;
}

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {

  private snackbars: SnackBarQueueItem[];

  private readonly snackBarQueue = new BehaviorSubject<SnackBarQueueItem[]>([]);
  private readonly snackBarQueue$ = this.snackBarQueue.asObservable();

  constructor(public snackBar: MatSnackBar) {
    let alreadyDismissed = false;

    this.snackBarQueue$.subscribe(e => {
      console.log(e);
      if (!alreadyDismissed && this.snackBar._openedSnackBarRef) {
        this.snackBar.dismiss();
      }
      alreadyDismissed = false;

      const nextIndex = e.length - 1;
      if (nextIndex >= 0) {
        const next = e[nextIndex];
        this.snackBar.open(next.message, "Close", next.configParams);
        this.snackBar._openedSnackBarRef?.afterDismissed().subscribe((close) => {
          if (close.dismissedByAction) {
            alreadyDismissed = true;
            this.dequeueSnackbar();
          }
        })
      }
    })
  }

  queueSnackbar(message: string, configParams?: MatSnackBarConfig) {
    if (this.snackBarQueue.value.find(snack => snack.message == message)) {
      return;
    }

    this.snackBarQueue.next(
      this.snackBarQueue.value.concat([{message, configParams}]),
    );
  }

  dequeueSnackbar() {
    this.snackBarQueue.value.pop()
    this.snackBarQueue.next(
      this.snackBarQueue.value,
    );
  }
}