"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Mail, Send, ChevronLeft, Clock } from "lucide-react";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

// Mock data
const mockMessages: Message[] = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan.perez@email.com",
    subject: "Consulta sobre envío",
    message: "Hola, compré un monitor hace una semana y aún no llegó. ¿Me pueden dar información sobre el estado del envío?",
    date: "2026-05-20 14:30",
    read: false,
  },
  {
    id: "2",
    name: "María González",
    email: "maria.gonzalez@email.com",
    subject: "Producto dañado",
    message: "Recibí mi pedido pero el teclado llegó con una tecla suelta. ¿Pueden cambiarlo por uno nuevo?",
    date: "2026-05-20 11:15",
    read: false,
  },
  {
    id: "3",
    name: "Pedro Sánchez",
    email: "pedro.sanchez@email.com",
    subject: "Pregunta sobre garantía",
    message: "¿Cuánto tiempo de garantía tiene el mouse gaming que vendieron la semana pasada?",
    date: "2026-05-19 16:45",
    read: true,
  },
  {
    id: "4",
    name: "Laura Fernández",
    email: "laura.fernandez@email.com",
    subject: "Cancelación de pedido",
    message: "Necesito cancelar mi pedido ORD-005. No lo necesito más. Por favor confirmen la cancelación.",
    date: "2026-05-18 09:20",
    read: true,
  },
];

export default function AdminMessages() {
  const [search, setSearch] = useState("");
  const [messages] = useState<Message[]>(mockMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");

  const filteredMessages = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.read).length;

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    // TODO: Implement actual reply logic
    setReplyText("");
    setSelectedMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Mensajes
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {unreadCount > 0 && (
              <span className="text-[var(--accent)]">{unreadCount} sin leer · </span>
            )}
            {filteredMessages.length} mensajes totales
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <Input
            placeholder="Buscar mensajes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex h-[600px] gap-4 rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden">
        {/* Messages List */}
        <div className="w-full overflow-y-auto lg:w-1/3">
          {filteredMessages.map((message) => (
            <button
              key={message.id}
              onClick={() => setSelectedMessage(message)}
              className={`w-full border-b border-slate-800/50 p-4 text-left transition-colors hover:bg-slate-900/30 ${
                selectedMessage?.id === message.id ? "bg-slate-900/50" : ""
              } ${!message.read ? "border-l-2 border-l-[var(--accent)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!message.read && (
                      <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    )}
                    <p className={`truncate text-sm ${!message.read ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>
                      {message.name}
                    </p>
                  </div>
                  <p className={`mt-1 truncate text-sm ${!message.read ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>
                    {message.subject}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-[var(--foreground-muted)]">
                  {message.date}
                </span>
              </div>
            </button>
          ))}

          {filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-[var(--foreground-muted)]" />
              <p className="mt-4 text-sm text-[var(--foreground-muted)]">
                No hay mensajes
              </p>
            </div>
          )}
        </div>

        {/* Message Detail */}
        {selectedMessage ? (
          <div className="hidden flex-1 flex-col border-l border-slate-800 lg:flex">
            {/* Header */}
            <div className="border-b border-slate-800 p-4">
              <button
                onClick={() => setSelectedMessage(null)}
                className="mb-2 flex items-center gap-1 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)] lg:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Volver</span>
              </button>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {selectedMessage.subject}
              </h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <span>{selectedMessage.name}</span>
                <span>·</span>
                <span>{selectedMessage.email}</span>
                <span>·</span>
                <span>{selectedMessage.date}</span>
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="rounded-lg bg-slate-900/50 p-4">
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            {/* Reply Box */}
            <div className="border-t border-slate-800 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe tu respuesta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  iconLeft={<Send className="h-4 w-4" />}
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="text-center">
              <Mail className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
              <p className="mt-4 text-sm text-[var(--foreground-muted)]">
                Selecciona un mensaje para verlo
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}