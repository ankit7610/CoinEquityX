import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Divider,
  Button,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import { Email, Person, CalendarToday, Verified, Cake, Wc, Work, Public, PhoneIphone, Timeline } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, UserProfile, isSupabaseConfigured } from '../supabase';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getUserProfile(user.uid)
        .then((data) => {
          setProfile(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load profile:', error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No user logged in
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Profile
      </Typography>

      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={3}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#00D09C',
                fontSize: '3rem',
                fontWeight: 700,
              }}
            >
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
                <Typography variant="h5" fontWeight={600}>
                  {user.displayName || 'User'}
                </Typography>
                {user.emailVerified && (
                  <Verified sx={{ color: '#00D09C', fontSize: '1.2rem' }} />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Member since {new Date(user.metadata.creationTime || '').toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Email sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Email
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {user.email}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Person sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Display Name
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {user.displayName || 'Not set'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <CalendarToday sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Last Sign In
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {new Date(user.metadata.lastSignInTime || '').toLocaleString()}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Verified sx={{ color: user.emailVerified ? '#00D09C' : 'text.disabled' }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Email Verification
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {user.emailVerified ? 'Verified' : 'Not verified'}
                </Typography>
              </Box>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : profile ? (
              <>
                {profile.age && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Cake sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Age
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {profile.age} years old
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {profile.gender && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Wc sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Gender
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {profile.gender}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {profile.domain && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Work sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Domain / Role
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {profile.domain}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {profile.experience_years !== undefined && profile.experience_years !== null && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Timeline sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Experience
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {profile.experience_years} {profile.experience_years === 1 ? 'year' : 'years'}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {profile.market_preference && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Public sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Market Preference
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {profile.market_preference}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {profile.dob && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Cake sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Date of Birth
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {new Date(profile.dob).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {profile.mobile && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <PhoneIphone sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Mobile
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {profile.mobile}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : '#FFF3E0',
                  borderRadius: 2,
                }}
              >
                {!isSupabaseConfigured ? (
                  <Stack spacing={1} alignItems="center">
                    <Typography variant="subtitle2" color="error" fontWeight="bold">
                      Configuration Error
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Supabase connection is not configured. Missing environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    Profile data not found in Supabase
                  </Typography>
                )}
              </Paper>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack spacing={2}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 208, 156, 0.1)' : '#E8F5E9',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary" align="center" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                Firebase UID: {user.uid}
              </Typography>
            </Paper>

            {profile && (
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Chip
                  label="✓ Supabase Synced"
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`Profile ID: ${profile.id?.slice(0, 8)}...`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
