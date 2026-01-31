import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  AppBar,
  Toolbar,
  Button,
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const BACKEND_URL = (window.BACKEND_URL || "http://localhost:8080").replace(
  /\/$/,
  "",
);

export default function Dashboard({ onLogout }) {
  const [metrics, setMetrics] = useState(null);
  const [executions, setExecutions] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [mRes, eRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/metrics`, { headers }),
        axios.get(`${BACKEND_URL}/api/executions`, { headers }),
      ]);

      setMetrics(mRes.data);
      setExecutions(Array.isArray(eRes.data.data) ? eRes.data.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: ["Success", "Error", "Running"],
    datasets: [
      {
        label: "Executions",
        data: metrics
          ? [
              metrics.success,
              metrics.error,
              metrics.total_logs - metrics.success - metrics.error,
            ]
          : [0, 0, 0],
        backgroundColor: ["#4caf50", "#f44336", "#ff9800"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        ticks: {
          stepSize: 1,
          precision: 0,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Automation Dashboard
          </Typography>
          <Button color="inherit" onClick={onLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Metrics Chart */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Metrics
                </Typography>
                <Bar data={chartData} options={chartOptions} />
              </CardContent>
            </Card>
          </Grid>

          {/* Executions Table */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Executions
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Started At</TableCell>
                      <TableCell>Duration (ms)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {executions.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {String(row.execution_id || row.id)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            color={
                              row.status === "success" ? "success" : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(
                            row.created_at || row.startedAt,
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell>{row.duration_ms || "-"}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() =>
                              window.open(
                                `http://localhost:5678/workflow/${row.workflow_id}/executions/${row.execution_id}`,
                                "_blank",
                              )
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {executions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No executions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
