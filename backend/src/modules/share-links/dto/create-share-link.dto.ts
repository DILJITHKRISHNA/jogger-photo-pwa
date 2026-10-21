import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';
import { MAX_PHOTOS_PER_LINK } from '../share-links.service';

export class CreateShareLinkDto {
  /** The selected products, in the order they should appear on the link's page. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PHOTOS_PER_LINK)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  productIds!: string[];
}
