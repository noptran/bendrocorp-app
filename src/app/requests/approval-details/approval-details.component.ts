import { Component, OnInit, OnDestroy } from '@angular/core';
import { RequestsService } from '../requests.service';
import { MyApproval } from '../../models/approval-models';
import { HttpErrorResponse } from '../../../../node_modules/@angular/common/http';
import { ActivatedRoute } from '../../../../node_modules/@angular/router';
import { Subscription } from '../../../../node_modules/rxjs';
import { SpinnerService } from '../../misc/spinner/spinner.service';

@Component({
  selector: 'app-approval-details',
  templateUrl: './approval-details.component.html',
  styleUrls: ['./approval-details.component.css']
})
export class ApprovalDetailsComponent implements OnInit, OnDestroy {
  
  approval:MyApproval
  approvalId:number = parseInt(this.route.snapshot.paramMap.get('approval_id'))
  approvalSubmitting:boolean = false
  dataLoaded:boolean = false
  subscription:Subscription
  constructor(private requestsService:RequestsService, private route:ActivatedRoute, private spinnerService:SpinnerService) { 
    this.subscription = this.requestsService.dataRefreshAnnounced$.subscribe(
      () => {
        this.fetchApproval()
      }
    )
  }

  fetchApproval() {
    this.requestsService.list_approvals().subscribe(
      (results) => {
        if (!(results instanceof HttpErrorResponse)) {
          this.approval = results.find(x => x.approval_id == this.approvalId)
          console.log(this.approval);          
          this.dataLoaded = true
          this.spinnerService.spin(false)
        }
      }
    )
  }

  submitApproval(approvalId:number, typeId:number) {
    let appDen:string = "..."
    if (typeId === 4) {
      appDen = "approve"
    }

    if (typeId == 5) {
      appDen = "deny"
    }
    if (confirm(`Are you sure you want to ${appDen} approval #${approvalId}?`)) {
      this.approvalSubmitting = true
      this.requestsService.submit_approval(approvalId, typeId).subscribe(
        (results) => {
          if (!(results instanceof HttpErrorResponse))
          {
            this.fetchApproval()
          }
          this.approvalSubmitting = false
        }
      )
    }
  }

  ngOnInit() {
    this.spinnerService.spin(true)
    this.fetchApproval()
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

}
