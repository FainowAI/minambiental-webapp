import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface MonthlyReading {
  mes: string;
  hidrometro: number | null;
  horimetro: number | null;
  nd: number | null;
  ne: number | null;
}

interface MonitoringHistoryChartProps {
  data: MonthlyReading[];
}

const MonitoringHistoryChart = ({ data }: MonitoringHistoryChartProps) => {
  // Configuração do gráfico
  const chartConfig = {
    hidrometro: {
      label: 'Hidrômetro',
      color: '#10b981', // emerald-500
    },
    horimetro: {
      label: 'Horímetro',
      color: '#34d399', // emerald-400
    },
    nd: {
      label: 'ND (m)',
      color: '#6b7280', // gray-500
    },
    ne: {
      label: 'NE (m)',
      color: '#9ca3af', // gray-400
    },
  };

  // Filtrar apenas meses com pelo menos um valor não nulo
  const filteredData = data.filter(
    (item) =>
      item.hidrometro !== null ||
      item.horimetro !== null ||
      item.nd !== null ||
      item.ne !== null
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-xl">
              Histórico de Hidrômetro, Horímetro, ND(m) e NE(m)
            </CardTitle>
            <CardDescription>
              Acompanhamento anual das leituras a partir da primeira apuração
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium mb-2">
              O monitoramento da outorga ainda não foi iniciado
            </p>
            <p className="text-sm text-gray-500">
              O histórico será exibido após a primeira apuração.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis
                    dataKey="mes"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                    formatter={(value) => {
                      const config = chartConfig[value as keyof typeof chartConfig];
                      return config ? config.label : value;
                    }}
                  />
                  <Bar
                    dataKey="hidrometro"
                    fill={chartConfig.hidrometro.color}
                    name="Hidrômetro"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="horimetro"
                    fill={chartConfig.horimetro.color}
                    name="Horímetro"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="nd"
                    fill={chartConfig.nd.color}
                    name="ND (m)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="ne"
                    fill={chartConfig.ne.color}
                    name="NE (m)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonitoringHistoryChart;

