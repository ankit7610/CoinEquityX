import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, Fab, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { Close, Send, SmartToy } from '@mui/icons-material';
import { sendChatMessage } from '../api';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: uid(), role: 'assistant', text: 'Hi! Ask me anything about crypto/markets, the dashboard, or your portfolio.' }
  ]);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages.length]);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  async function onSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);

    const userMsg: ChatMessage = { id: uid(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const reply = await sendChatMessage(text);
      const assistantMsg: ChatMessage = { id: uid(), role: 'assistant', text: reply || 'Sorry, I could not generate a reply.' };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        text: err?.message ? `Error: ${err.message}` : 'Error: failed to send message.'
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 88,
            width: { xs: 'calc(100vw - 32px)', sm: 360 },
            height: { xs: 'min(70vh, 520px)', sm: 460 },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            zIndex: 1400
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 1.5,
              py: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00D09C 0%, #44C1F0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <SmartToy fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.1 }}>
                  Crypto Assistant
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.1 }}>
                  Powered by Gemini
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close chat">
              <Close fontSize="small" />
            </IconButton>
          </Stack>

          <Box
            ref={listRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 1.5,
              py: 1.25,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#FAFAFA')
            }}
          >
            <Stack spacing={1.25}>
              {messages.map((m) => (
                <Box
                  key={m.id}
                  sx={{
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '85%',
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      bgcolor: m.role === 'user' ? 'primary.main' : 'background.paper',
                      color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
                      border: m.role === 'assistant' ? '1px solid' : 'none',
                      borderColor: m.role === 'assistant' ? 'divider' : 'transparent'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {m.text}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {sending && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Thinking…
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          <Box
            sx={{
              p: 1.25,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                size="small"
                fullWidth
                multiline
                maxRows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void onSend();
                  }
                }}
              />
              <IconButton onClick={() => void onSend()} disabled={!canSend} aria-label="Send message">
                <Send fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      )}

      <Fab
        color="primary"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 1401,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}
      >
        {open ? <Close /> : <SmartToy />}
      </Fab>
    </>
  );
}

