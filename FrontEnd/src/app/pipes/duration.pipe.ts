import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) return '0s';

    // Parse ISO 8601 duration (e.g. "PT1H30M15S")
    // Note: This is a simplified regex that works for time components
    const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    
    if (!match) return value;

    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;

    let result = '';

    if (hours > 0) {
      result = `${hours}hr`;
      if (minutes > 0) {
        result += ` ${minutes}m`;
      }
    } else if (minutes > 0) {
      result = `${minutes} min`;
      if (seconds > 0) {
        result += ` ${seconds}`;
      }
    } else if (seconds > 0) {
      result = `${seconds}s`;
    } else {
      return '0s';
    }

    return result.trim();
  }

}
