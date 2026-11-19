/**
 * Purchase order specific status constants.
 * Depends on the shared STATUS_CODES / StatusCode from statusConstants.ts -
 * codes are never duplicated here; the PO lifecycle is defined as an ordered
 * flow of those shared codes.
 */
import { STATUS_CODES, type StatusCode } from "../../../shared/constants/statusConstants";

/** Purchase order specific lifecycle - strictly ordered status flow. */
export const PO_STATUS_FLOW: readonly StatusCode[] = [
  STATUS_CODES.DRAFT,
  STATUS_CODES.PENDING,
  STATUS_CODES.ARRIVING,
  STATUS_CODES.ARRIVED,
  STATUS_CODES.COMPLETED,
];

export const PO_TYRE_STATUS_FLOW: readonly StatusCode[] = [...PO_STATUS_FLOW];

/** PO statuses whose edit action stays available. */
export const PO_EDITABLE_STATUSES: readonly StatusCode[] = [
  STATUS_CODES.DRAFT,
  STATUS_CODES.PENDING,
];

/** PO statuses whose location allocation action stays available. */
export const PO_LOCATION_ALLOCATABLE_STATUSES: readonly StatusCode[] = [
  STATUS_CODES.DRAFT,
  STATUS_CODES.PENDING,
];

/** PO statuses that may be deleted. Once sent to a supplier, records are locked. */
export const PO_DELETABLE_STATUSES: readonly StatusCode[] = [
  STATUS_CODES.DRAFT,
  STATUS_CODES.PENDING,
];

/**
 * Next-step label for each PO status, keyed by current status.
 * Drives the single advance action on the PO details page.
 */
export const PO_STATUS_STEPS: {
  [status in StatusCode]?: { label: string; next: StatusCode };
} = {
  [STATUS_CODES.PENDING]: { label: 'Arriving', next: STATUS_CODES.ARRIVING },
  [STATUS_CODES.ARRIVING]: { label: 'Arrived', next: STATUS_CODES.ARRIVED },
  [STATUS_CODES.ARRIVED]: { label: 'Complete', next: STATUS_CODES.COMPLETED },
};

export const getPoNextStatus = (current: StatusCode): StatusCode | undefined => {
  const index = PO_STATUS_FLOW.indexOf(current);
  return index !== -1 && index < PO_STATUS_FLOW.length - 1 ? PO_STATUS_FLOW[index + 1] : undefined;
};

export const getPoTyreNextStatus = (current: StatusCode): StatusCode | undefined => {
  const index = PO_TYRE_STATUS_FLOW.indexOf(current);
  return index !== -1 && index < PO_TYRE_STATUS_FLOW.length - 1 ? PO_TYRE_STATUS_FLOW[index + 1] : undefined;
};