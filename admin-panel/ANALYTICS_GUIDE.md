# Analytics Dashboard Guide

## Overview

The analytics dashboard provides comprehensive insights into sponsor performance, click metrics, and revenue data for your sponsorship program.

## Features

### Summary Statistics

Four key metrics displayed at the top of the dashboard:

1. **Monthly Recurring Revenue (MRR)**
   - Total monthly fees from all active sponsors
   - Shows overall revenue potential

2. **Total Clicks**
   - Aggregate click count across all sponsored content
   - Can be filtered by date range

3. **Active Sponsors**
   - Number of currently active sponsors
   - Sponsors with `is_active = true`

4. **Revenue per Click**
   - Average monthly fee divided by total clicks
   - Helps evaluate sponsor ROI

### Click Distribution by Location

Visual breakdown of where clicks are happening:

- **Resources Page**: Clicks from the main resources library
- **Dashboard**: Clicks from dashboard recommendations
- **Curriculum Page**: Clicks from curriculum-related placements
- **Learning Log**: Clicks from learning log suggestions

### Sponsor Performance

Expandable cards for each sponsor showing:

**Summary View:**

- Sponsor name and tier
- Monthly fee
- Total clicks
- Cost per click

**Expanded View:**

- Click breakdown by location (which pages are driving engagement)
- Top performing resources (which specific resources get the most clicks)

## Date Range Filtering

Use the date picker at the top to filter analytics by specific time periods:

- Start Date: Beginning of the period
- End Date: End of the period
- Clear Filter: Reset to all-time data

## Understanding the Metrics

### Cost Per Click

Formula: `Monthly Fee / Total Clicks`

- Lower is better for sponsors (they're paying less per user engagement)
- Higher is better for you (more revenue per engagement)
- Typical ranges:
  - $1-5: Excellent engagement
  - $5-10: Good engagement
  - $10-20: Moderate engagement
  - $20+: Low engagement (may need optimization)

### Location Performance

- **Resources Page**: Usually highest click rate (primary discovery location)
- **Dashboard**: Good for personalized recommendations
- **Curriculum Page**: Strong for curriculum-related sponsors
- **Learning Log**: Contextual recommendations

## API Endpoints

The dashboard uses two main endpoints:

### GET /api/analytics/summary

Returns aggregate statistics:

```json
{
  "totalRevenue": 4500,
  "totalClicks": 234,
  "activeSponsors": 3,
  "avgRevenuePerClick": 19.23
}
```

Query Parameters:

- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

### GET /api/analytics

Returns detailed sponsor analytics:

```json
[
  {
    "sponsorId": "uuid",
    "sponsorName": "Khan Academy",
    "tier": "premium",
    "monthlyFee": 1500,
    "totalClicks": 156,
    "clicksByLocation": {
      "resources_page": 89,
      "dashboard": 45,
      "curriculum_page": 15,
      "learning_log": 7
    },
    "clicksByResource": [
      {
        "resourceId": "uuid",
        "resourceName": "Khan Academy Math",
        "clicks": 120
      }
    ]
  }
]
```

Query Parameters:

- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

## Privacy & Data Collection

What we track:

- Anonymous clicks (timestamp + location + resource)
- NO user identification
- NO student information
- NO conversion tracking

What sponsors receive:

- Aggregate click counts
- Location breakdown
- Resource performance
- NO user data

## Reporting to Sponsors

Use the analytics dashboard to generate monthly reports:

1. Set date range to previous month
2. Export sponsor-specific data:
   - Total clicks for the month
   - Click breakdown by location
   - Top performing resources
   - Cost per click analysis

3. Send report via email with summary:

   ```
   Dear [Sponsor],

   Here's your performance report for [Month]:

   - Total Clicks: 156
   - Resources Page: 89 clicks
   - Dashboard: 45 clicks
   - Curriculum Page: 15 clicks
   - Learning Log: 7 clicks

   Top Resource: Khan Academy Math (120 clicks)

   Cost per Click: $9.62

   Thank you for your partnership!
   ```

## Future Enhancements

Potential improvements:

- Export to CSV/PDF
- Charts and visualizations (line graphs, pie charts)
- Click trends over time
- Comparison between sponsors
- Conversion tracking (if user privacy allows)
- A/B testing for placement optimization

## Note on Convex Migration

FYI: The admin panel will be migrated to use Convex as the datastore in the future. The analytics structure and API will remain the same, only the underlying database implementation will change.
