type SensorPayload = {
  temperature?: number | string;
  humidity?: number | string;
  pressure?: number | string;
  device?: string;
};

const latestSensorData = {
  temperature: null as number | null,
  humidity: null as number | null,
  pressure: null as number | null,
  timestamp: null as string | null,
  device: "ESP32-BME280",
};

function parseNumber(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET() {
  return Response.json({
    ok: true,
    data: latestSensorData,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SensorPayload;

    const temperature = parseNumber(body.temperature);
    const humidity = parseNumber(body.humidity);
    const pressure = parseNumber(body.pressure);

    if (temperature === null || humidity === null || pressure === null) {
      return Response.json(
        {
          ok: false,
          error: "Dados do sensor incompletos. Envie temperatura, umidade e pressão.",
        },
        { status: 400 }
      );
    }

    latestSensorData.temperature = temperature;
    latestSensorData.humidity = humidity;
    latestSensorData.pressure = pressure;
    latestSensorData.timestamp = new Date().toISOString();
    latestSensorData.device = body.device ?? "ESP32-BME280";

    return Response.json({
      ok: true,
      message: "Dados recebidos com sucesso.",
      data: latestSensorData,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "JSON inválido. Verifique o corpo da requisição.",
      },
      { status: 400 }
    );
  }
}
