import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Archive,
  CheckSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: number;
  userId: number;
  type: "approval_pending" | "task_blocked" | "qa_completed" | "sprint_closed" | "task_assigned";
  title: string;
  message?: string;
  taskId?: number;
  sprintId?: number;
  read: boolean;
  archived: boolean;
  createdAt: Date;
}

const typeLabels: Record<string, string> = {
  approval_pending: "Aprobación Pendiente",
  task_blocked: "Tarea Bloqueada",
  qa_completed: "QA Completado",
  sprint_closed: "Sprint Cerrado",
  task_assigned: "Tarea Asignada",
};

const typeColors: Record<string, string> = {
  approval_pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  task_blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  qa_completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  sprint_closed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  task_assigned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
};

const typeIcons: Record<string, React.ReactNode> = {
  approval_pending: <Clock className="w-4 h-4" />,
  task_blocked: <AlertCircle className="w-4 h-4" />,
  qa_completed: <CheckCircle2 className="w-4 h-4" />,
  sprint_closed: <CheckSquare className="w-4 h-4" />,
  task_assigned: <CheckCircle2 className="w-4 h-4" />,
};

export function NotificationCenter() {
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  // Queries
  const notificationsQuery = trpc.notifications.list.useQuery({ unreadOnly: false });
  const unreadCountQuery = trpc.notifications.getUnreadCount.useQuery();

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markMultipleAsReadMutation = trpc.notifications.markMultipleAsRead.useMutation();
  const archiveMutation = trpc.notifications.archive.useMutation();
  const archiveMultipleMutation = trpc.notifications.archiveMultiple.useMutation();

  const notifications = (notificationsQuery.data || []) as Notification[];
  const unreadNotifications = notifications.filter(n => !n.read);
  const archivedNotifications = notifications.filter(n => n.archived);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
      notificationsQuery.refetch();
      toast.success("Marcado como leído");
    } catch (error) {
      toast.error("Error al marcar como leído");
    }
  };

  const handleArchive = async (notificationId: number) => {
    try {
      await archiveMutation.mutateAsync({ notificationId });
      notificationsQuery.refetch();
      toast.success("Archivado");
    } catch (error) {
      toast.error("Error al archivar");
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      await markMultipleAsReadMutation.mutateAsync({ notificationIds: selectedNotifications });
      setSelectedNotifications([]);
      notificationsQuery.refetch();
      toast.success(`${selectedNotifications.length} marcadas como leídas`);
    } catch (error) {
      toast.error("Error al marcar como leídas");
    }
  };

  const handleArchiveSelected = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      await archiveMultipleMutation.mutateAsync({ notificationIds: selectedNotifications });
      setSelectedNotifications([]);
      notificationsQuery.refetch();
      toast.success(`${selectedNotifications.length} archivadas`);
    } catch (error) {
      toast.error("Error al archivar");
    }
  };

  const toggleNotificationSelection = (id: number) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`p-4 rounded-lg border transition-all ${
        notification.read
          ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selectedNotifications.includes(notification.id)}
          onCheckedChange={() => toggleNotificationSelection(notification.id)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={typeColors[notification.type]}>
              {typeIcons[notification.type]}
              <span className="ml-1">{typeLabels[notification.type]}</span>
            </Badge>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>
          <h4 className="font-semibold text-slate-900 dark:text-white">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-1">
          {!notification.read && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleMarkAsRead(notification.id)}
              title="Marcar como leído"
            >
              <CheckSquare className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleArchive(notification.id)}
            title="Archivar"
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 rounded-lg p-6">
      <div className="space-y-4">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Centro de Notificaciones
          </h2>
          {unreadCountQuery.data && unreadCountQuery.data.count > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCountQuery.data.count} nuevas
            </Badge>
          )}
        </div>

        {/* Acciones en lote */}
        {selectedNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {selectedNotifications.length} seleccionadas
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkSelectedAsRead}
              className="ml-auto"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              Marcar como leídas
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleArchiveSelected}
            >
              <Archive className="w-4 h-4 mr-1" />
              Archivar
            </Button>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Sin leer ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archivadas ({archivedNotifications.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Todas */}
          <TabsContent value="all" className="space-y-3 mt-4">
            {notificationsQuery.isLoading ? (
              <div className="text-center py-8 text-slate-500">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No hay notificaciones
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Tab: Sin leer */}
          <TabsContent value="unread" className="space-y-3 mt-4">
            {unreadNotifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No hay notificaciones sin leer
              </div>
            ) : (
              <AnimatePresence>
                {unreadNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Tab: Archivadas */}
          <TabsContent value="archived" className="space-y-3 mt-4">
            {archivedNotifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No hay notificaciones archivadas
              </div>
            ) : (
              <AnimatePresence>
                {archivedNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
