import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuthGuard } from "./components/AuthGuard";
import { DailyCheckIn } from "./pages/DailyCheckIn";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { Exercises } from "./pages/Exercises";
import { GoalEdit } from "./pages/GoalEdit";
import { Goals } from "./pages/Goals";
import { History } from "./pages/History";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Measurements } from "./pages/Measurements";
import { Onboarding } from "./pages/Onboarding";
import { SessionDetail } from "./pages/SessionDetail";
import { Settings } from "./pages/Settings";
import { WeekPlan } from "./pages/WeekPlan";
import { WeeklyCheckIn } from "./pages/WeeklyCheckIn";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={
            <AuthGuard>
              <Onboarding />
            </AuthGuard>
          }
        />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/week" element={<WeekPlan />} />
                  <Route path="/measurements" element={<Measurements />} />
                  <Route path="/exercises" element={<Exercises />} />
                  <Route path="/exercises/:id" element={<ExerciseDetail />} />
                  <Route path="/check-in/daily" element={<DailyCheckIn />} />
                  <Route path="/check-in/weekly" element={<WeeklyCheckIn />} />
                  <Route path="/session/:id" element={<SessionDetail />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/goals/new" element={<GoalEdit />} />
                  <Route path="/goals/:id" element={<GoalEdit />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AppShell>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
