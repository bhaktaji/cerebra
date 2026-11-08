# Cerebra R8 / ProGuard Configuration
-keep class com.cerebra.puzzles.data.** { *; }
-keep class com.cerebra.puzzles.domain.** { *; }
-keepnames class androidx.room.** { *; }
-dontwarn kotlinx.coroutines.**
