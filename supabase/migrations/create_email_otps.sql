-- Create the email_otps table for OTP verification
create table if not exists email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp text not null,
  expires_at timestamp not null
);
create index if not exists email_otps_email_idx on email_otps (email);
