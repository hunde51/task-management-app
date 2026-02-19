/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "./AuthContext";
import { listTeams, type Team } from "../services/teamService";

type WorkspaceContextValue = {
  teams: Team[];
  loadingTeams: boolean;
  teamsError: string;
  refreshTeams: () => Promise<void>;
  prependTeam: (team: Team) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { token, isReady } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState("");

  const refreshTeams = useCallback(async () => {
    if (!token) {
      setTeams([]);
      setTeamsError("");
      return;
    }

    setLoadingTeams(true);
    setTeamsError("");

    try {
      const response = await listTeams(token);
      setTeams(response);
    } catch (error) {
      setTeamsError(error instanceof Error ? error.message : "Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  }, [token]);

  const prependTeam = useCallback((team: Team) => {
    setTeams((current) => {
      if (current.some((item) => item.id === team.id)) return current;
      return [team, ...current];
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      setTeams([]);
      setTeamsError("");
      return;
    }

    void refreshTeams();
  }, [isReady, token, refreshTeams]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({ teams, loadingTeams, teamsError, refreshTeams, prependTeam }),
    [teams, loadingTeams, teamsError, refreshTeams, prependTeam]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
