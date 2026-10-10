import { getAccessToken, setCachedAccessToken } from './googleAuth';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string; // YYYY-MM-DD (all-day event)
    dateTime?: string; // ISO 8601
  };
  end: {
    date?: string;
    dateTime?: string;
  };
  htmlLink?: string;
}

/**
 * Obtiene los eventos del calendario primario de Google para el rango de fechas relevante.
 */
export const fetchCalendarEvents = async (timeMin?: string): Promise<GoogleCalendarEvent[]> => {
  const token = await getAccessToken();
  if (!token) {
    return [];
  }

  // Por defecto, traer eventos desde hace 30 días en adelante
  const minTime = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=150&timeMin=${encodeURIComponent(minTime)}&orderBy=startTime&singleEvents=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        setCachedAccessToken(null); // Clear expired token
      }
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
};

/**
 * Crea un evento en el Google Calendar primario del usuario.
 */
export const syncEventToCalendar = async (event: {
  summary: string;
  description: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}): Promise<GoogleCalendarEvent> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Inicia sesión con Google para sincronizar eventos en tiempo real.');

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { date: event.start },
      end: { date: event.end }
    })
  });

  if (!response.ok) {
    if (response.status === 401) {
      setCachedAccessToken(null); // Clear expired token
      throw new Error('La sesión de Google ha expirado. Por favor, vuelve a iniciar sesión para sincronizar.');
    }
    const errorDetails = await response.text();
    throw new Error(`Error en Google Calendar API: ${response.status} ${errorDetails}`);
  }

  return response.json();
};
