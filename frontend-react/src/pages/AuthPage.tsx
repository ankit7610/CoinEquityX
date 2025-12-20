import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme,
  Avatar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  TrendingUp,
  AccountCircle,
  Email,
  Lock
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    avatarEmoji: '🪙',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    domain: '',
    experienceYears: '',
    experienceLevel: '',
    marketPreference: '',
    dob: '',
    mobile: ''
  });

  const { signup, login, loginWithGoogle } = useAuth();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp && signupStep === 1) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        setSignupStep(2);
        setLoading(false);
        return;
      }

      if (isSignUp && signupStep === 2) {
        await signup(
          formData.email, 
          formData.password, 
          formData.name,
          formData.nickname || undefined,
          formData.avatarEmoji || undefined,
          formData.age ? parseInt(formData.age) : undefined,
          formData.gender || undefined,
          formData.domain || undefined,
          formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
          formData.experienceLevel || undefined,
          formData.marketPreference || undefined,
          formData.dob || undefined,
          formData.mobile || undefined
        );
      }

      if (!isSignUp) {
        await login(formData.email, formData.password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFormData({
      name: '',
      nickname: '',
      avatarEmoji: '🪙',
      email: '',
      password: '',
      confirmPassword: '',
      age: '',
      gender: '',
      domain: '',
      experienceYears: '',
      experienceLevel: '',
      marketPreference: '',
      dob: '',
      mobile: ''
    });
    setSignupStep(1);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' ? '#0f1419' : '#F8F9FA',
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          mx: 2,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
          animation: 'slideUp 0.5s ease-out',
          '@keyframes slideUp': {
            from: {
              opacity: 0,
              transform: 'translateY(40px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo and Header */}
          <Stack alignItems="center" spacing={2} mb={3.5}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00D09C 0%, #44C1F0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'white',
              }}
            >
              ₿
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={500} gutterBottom sx={{ fontSize: '1.1rem' }}>
                Welcome to Crypto Pulse
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                {isSignUp ? 'Create your account to start trading' : 'Welcome back! Sign in to continue'}
              </Typography>
            </Box>
          </Stack>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                animation: 'shake 0.5s ease',
                '@keyframes shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(-10px)' },
                  '75%': { transform: 'translateX(10px)' },
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {isSignUp ? (
                signupStep === 1 ? (
                  <>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      InputProps={{ startAdornment: <InputAdornment position="start"><AccountCircle color="primary" /></InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      fullWidth
                      label="Nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="Your display nickname"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" color="text.secondary">
                        Choose an emoji
                      </Typography>
                      {['🪙', '🚀', '🐂', '🦊', '🐼', '🐳'].map((emoji) => (
                        <Button
                          key={emoji}
                          variant={formData.avatarEmoji === emoji ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setFormData({ ...formData, avatarEmoji: emoji })}
                          sx={{ minWidth: 36, borderRadius: 1 }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </Stack>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      InputProps={{ startAdornment: <InputAdornment position="start"><Email color="primary" /></InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Lock color="primary" /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="primary" /></InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </>
                ) : (
                  <>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Age"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        InputProps={{ inputProps: { min: 1, max: 120 } }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        select
                        fullWidth
                        label="Gender"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        SelectProps={{ native: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <option value=""></option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </TextField>
                    </Stack>
                    <TextField
                      select
                      fullWidth
                      label="Domain / Role"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      SelectProps={{ native: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      <option value=""></option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Fullstack">Fullstack</option>
                      <option value="Data">Data</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Product">Product</option>
                    </TextField>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        select
                        fullWidth
                        label="Experience Level"
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                        SelectProps={{ native: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <option value=""></option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </TextField>
                      <TextField
                        select
                        fullWidth
                        label="Market to Explore"
                        value={formData.marketPreference}
                        onChange={(e) => setFormData({ ...formData, marketPreference: e.target.value })}
                        SelectProps={{ native: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <option value=""></option>
                        <option value="Crypto">Crypto</option>
                        <option value="Stocks">Stocks</option>
                        <option value="Both">Both</option>
                      </TextField>
                    </Stack>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+1-555-123-4567"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </>
                )
              ) : (
                <>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email color="primary" /></InputAdornment> }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock color="primary" /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  background: '#00D09C',
                  '&:hover': { background: '#00B881' },
                  '&:disabled': { background: '#9E9E9E' },
                }}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <TrendingUp />}
              >
                {loading
                  ? 'Please wait...'
                  : isSignUp
                    ? signupStep === 1
                      ? 'Next'
                      : 'Create Account'
                    : 'Sign In'}
              </Button>
            </Stack>
          </form>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              OR
            </Typography>
          </Divider>

          {/* Google Sign In */}
          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 1.5,
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
            startIcon={<Google />}
          >
            Continue with Google
          </Button>

          {/* Toggle Sign In/Sign Up */}
          <Box textAlign="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Typography
                component="span"
                variant="body2"
                fontWeight={700}
                color="primary"
                sx={{
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: 'primary.dark',
                  },
                }}
                onClick={toggleMode}
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </Typography>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
