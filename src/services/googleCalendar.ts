import { getAccessToken } from './googleAuth';

export const syncEventToCalendar = async (event: {
  summary: string;
  description: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { date: event.start },
      end: { date: event.end },
    }),
  });

  if (!response.ok) throw new Error('Failed to sync calendar event');
  return response.json();
};
