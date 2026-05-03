package com.example.womensafety;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.SoundPool;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.telephony.SmsManager;
import android.widget.*;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.*;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private Button buttonSOS, buttonProfile, buttonCall, buttonCallHome, buttonImSafe;
    private ImageButton buttonAbout;
    private FusedLocationProviderClient fusedLocationClient;
    private TextView greetingTextView;
    private SoundPool soundPool;
    private int soundID;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // UI
        buttonSOS = findViewById(R.id.buttonSOS);
        buttonProfile = findViewById(R.id.buttonProfile);
        buttonCall = findViewById(R.id.buttonCall);
        buttonCallHome = findViewById(R.id.buttonCallHome);
        buttonImSafe = findViewById(R.id.buttonImSafe);
        buttonAbout = findViewById(R.id.buttonAbout);
        greetingTextView = findViewById(R.id.greetingTextView);

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        // Sound
        soundPool = new SoundPool.Builder()
                .setMaxStreams(1)
                .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build())
                .build();

        soundID = soundPool.load(this, R.raw.siren, 1);

        updateGreeting();
        requestPermissions();

        // Click listeners
        buttonSOS.setOnClickListener(v -> handleSOSButtonClick());
        buttonImSafe.setOnClickListener(v -> sendImSafeMessage());
        buttonProfile.setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
        buttonCall.setOnClickListener(v -> callEmergency());
        buttonCallHome.setOnClickListener(v -> callHome());
        buttonAbout.setOnClickListener(v -> startActivity(new Intent(this, EmergencyActivity.class)));
    }

    // =========================
    // 🔐 PERMISSIONS
    // =========================
    private void requestPermissions() {
        ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.SEND_SMS,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.CALL_PHONE,
                Manifest.permission.RECORD_AUDIO
        }, 1);
    }

    // =========================
    // 👋 GREETING
    // =========================
    private void updateGreeting() {
        SharedPreferences sp = getSharedPreferences("UserProfile", MODE_PRIVATE);
        String name = sp.getString("Name", "User");
        greetingTextView.setText("Hello\n\t\t" + name);
    }

    // =========================
    // 🚨 SOS BUTTON
    // =========================
    private void handleSOSButtonClick() {
        if (checkPermissions()) {
            sendSOS();
        }
    }

    private boolean checkPermissions() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED;
    }

    private void sendSOS() {
        if (!isLocationEnabled()) {
            startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
            return;
        }

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, "Location permission required", Toast.LENGTH_SHORT).show();
            return;
        }

        fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener(location -> {
                    if (location != null) {
                        String link = "https://maps.google.com/?q=" +
                                location.getLatitude() + "," + location.getLongitude();

                        String msg = formatMessage("Help! I'm in danger.", link);
                        sendMessageToContacts(msg);

                        soundPool.play(soundID, 1f, 1f, 0, 0, 1f);
                    }
                });
    }

    private boolean isLocationEnabled() {
        android.location.LocationManager lm =
                (android.location.LocationManager) getSystemService(LOCATION_SERVICE);

        return lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER)
                || lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER);
    }

    private String formatMessage(String base, String link) {
        SharedPreferences sp = getSharedPreferences("UserProfile", MODE_PRIVATE);

        return base +
                " - Name: " + sp.getString("Name", "Unknown") +
                ", Age: " + sp.getString("Age", "Unknown") +
                ", Blood Group: " + sp.getString("BloodGroup", "Unknown") +
                ". " + link;
    }

    private void sendMessageToContacts(String message) {
        SharedPreferences sp = getSharedPreferences("UserProfile", MODE_PRIVATE);
        Gson gson = new Gson();

        String json = sp.getString("Contacts", "[]");
        Type type = new TypeToken<List<ProfileActivity.Contact>>() {}.getType();
        List<ProfileActivity.Contact> list = gson.fromJson(json, type);

        if (list == null || list.isEmpty()) {
            Toast.makeText(this, "No contacts added", Toast.LENGTH_SHORT).show();
            return;
        }

        for (ProfileActivity.Contact c : list) {
            try {
                SmsManager.getDefault().sendTextMessage(c.getNumber(), null, message, null, null);
                Toast.makeText(this, "Sent to " + c.getName(), Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Failed: " + c.getName(), Toast.LENGTH_SHORT).show();
            }
        }
    }

    // =========================
    // 📞 CALL EMERGENCY
    // =========================
    private void callEmergency() {
        String emergencyNumber = "741102*186";// emergency helpline

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE)
                == PackageManager.PERMISSION_GRANTED) {

            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + emergencyNumber));
            startActivity(callIntent);

        } else {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CALL_PHONE}, 2);
        }
    }

    // =========================
    // 📞 CALL HOME (FIXED)
    // =========================
    private void callHome() {
        SharedPreferences sharedPreferences = getSharedPreferences("UserProfile", MODE_PRIVATE);
        Gson gson = new Gson();

        String jsonContacts = sharedPreferences.getString("Contacts", "[]");
        Type type = new TypeToken<List<ProfileActivity.Contact>>() {}.getType();
        List<ProfileActivity.Contact> contactsList = gson.fromJson(jsonContacts, type);

        if (contactsList == null || contactsList.isEmpty()) {
            Toast.makeText(this, "No contacts available. Please add at least one contact.", Toast.LENGTH_LONG).show();
            return;
        }

        String phoneNumber = contactsList.get(0).getNumber(); // ✅ FIRST CONTACT

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            Intent callIntent = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + phoneNumber));
            startActivity(callIntent);
        } else {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CALL_PHONE}, 4);
        }
    }

    // =========================
    // 🟢 SAFE MESSAGE
    // =========================
    private void sendImSafeMessage() {
        sendMessageToContacts(formatMessage("I'm safe", ""));
    }

    // =========================
    // 🔁 PERMISSION RESULT
    // =========================
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        Toast.makeText(this, "Permissions handled", Toast.LENGTH_SHORT).show();
    }
}