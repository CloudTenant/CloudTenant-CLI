import { GeneralStatusTypes } from '@src/@types/enum';

export interface DescriptiveListRow {
  label: string;
  status: GeneralStatusTypes;
}
export interface DescriptiveList {
  head: string;
  rows: DescriptiveListRow[];
}
