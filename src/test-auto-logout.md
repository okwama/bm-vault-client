# Auto Logout Feature Test Guide

## Overview
The application now includes an auto logout feature that triggers after 7 minutes of inactivity, with a warning notification appearing 1 minute before logout.

## Features Implemented

### 1. Inactivity Detection
- Monitors user activity through mouse movements, clicks, keyboard input, scrolling, and touch events
- Resets timer on any user activity
- Only active when user is logged in

### 2. Session Warning (6 minutes)
- Shows a yellow warning notification 1 minute before auto logout
- Displays a countdown timer
- Provides "Stay Logged In" and "Logout Now" buttons
- Clicking "Stay Logged In" resets the session timer

### 3. Auto Logout (7 minutes)
- Automatically logs out user after 7 minutes of inactivity
- Shows a red notification confirming the logout
- Clears all authentication data from localStorage
- Redirects to login page

## How to Test

### Test Session Warning (6 minutes)
1. Log into the application
2. Stop all activity (don't move mouse, click, or type)
3. After 6 minutes, you should see a yellow warning notification
4. Test the "Stay Logged In" button - it should reset the timer
5. Test the "Logout Now" button - it should immediately log you out

### Test Auto Logout (7 minutes)
1. Log into the application
2. Stop all activity completely
3. After 7 minutes, you should be automatically logged out
4. A red notification should appear confirming the logout
5. You should be redirected to the login page

### Test Activity Reset
1. Log into the application
2. Wait for 5 minutes (before warning appears)
3. Perform any activity (move mouse, click, type, scroll)
4. The timer should reset and you should be able to continue for another 7 minutes

## Technical Implementation

### Files Modified/Created:
1. `src/hooks/useInactivityTimeout.ts` - Custom hook for inactivity detection
2. `src/contexts/AuthContext.tsx` - Updated to include auto logout functionality
3. `src/components/AutoLogoutNotification.tsx` - Notification for auto logout
4. `src/components/SessionWarningNotification.tsx` - Warning notification
5. `src/App.tsx` - Updated to include notifications

### Key Features:
- **Timeout**: 7 minutes (420,000ms)
- **Warning Time**: 1 minute before logout (60,000ms)
- **Activity Events**: mousedown, mousemove, keypress, scroll, touchstart, click, keydown
- **Auto-hide**: Notifications auto-hide after 5 seconds
- **Manual Reset**: Users can reset timer by clicking "Stay Logged In"

## Security Benefits
- Prevents unauthorized access to sensitive data
- Reduces risk of session hijacking
- Complies with security best practices for financial applications
- Protects user accounts when left unattended

## User Experience
- Clear visual feedback with countdown timer
- Option to extend session without losing work
- Immediate logout option for security-conscious users
- Smooth transitions and professional notifications 