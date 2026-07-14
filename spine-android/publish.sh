#!/bin/bash
set -e
cd "$(dirname "$0")"

# Source logging utilities
source ../formatters/logging/logging.sh

# Modern Central Portal Publishing Setup:
# 1. Set up PGP key for signing: gpg --generate-key
# 2. Create Central Portal account at https://central.sonatype.com/
# 3. Generate user token in Central Portal settings
# 4. Create ~/.gradle/gradle.properties with:
#    MAVEN_USERNAME=<central-portal-username>
#    MAVEN_PASSWORD=<central-portal-token>
#    signing.gnupg.passphrase=<pgp-key-passphrase>
#
# Version Configuration:
# - Edit spine-libgdx/gradle.properties and update the 'version' property (single source of truth)
# - For releases: version=4.2.9 (no -SNAPSHOT suffix)
# - For snapshots: version=4.2.9-SNAPSHOT (with -SNAPSHOT suffix)

log_title "Spine Android Publisher"

log_action "Reading version from spine-libgdx gradle.properties"
if VERSION=$(grep '^version=' ../spine-libgdx/gradle.properties | cut -d'=' -f2 2>&1); then
    log_ok
    log_detail "Version found: $VERSION"
else
    log_fail
    log_error_output "Failed to read version from ../spine-libgdx/gradle.properties"
    exit 1
fi

if echo "$VERSION" | grep -q "SNAPSHOT"; then
    log_detail "Detected SNAPSHOT version"
    log_action "Publishing SNAPSHOT version $VERSION to Central Portal"
    if GRADLE_OUTPUT=$(./gradlew :spine-android:publishReleasePublicationToSonaTypeRepository --info 2>&1); then
        log_ok
        log_summary "✓ Android SNAPSHOT published successfully to Central Portal"
    else
        log_fail
        log_error_output "$GRADLE_OUTPUT"
        exit 1
    fi
else
    log_detail "Detected RELEASE version"
    
    log_action "Publishing to SonaType repository"
    if GRADLE_OUTPUT=$(./gradlew :spine-android:publishReleasePublicationToSonaTypeRepository -PRELEASE 2>&1); then
        log_ok
    else
        log_fail
        log_error_output "$GRADLE_OUTPUT"
        exit 1
    fi
    
    log_action "Deploying via JReleaser"
    if GRADLE_OUTPUT=$(./gradlew :spine-android:jreleaserDeploy -PRELEASE --info 2>&1); then
        log_ok
        log_summary "✓ Android RELEASE published successfully to Central Portal"
    else
        log_fail
        log_error_output "$GRADLE_OUTPUT"
        exit 1
    fi
fi