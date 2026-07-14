@echo off
rmdir Plugins\SpinePlugin\Source\SpinePlugin\Public\spine-cpp /s /q
mkdir Plugins\SpinePlugin\Source\SpinePlugin\Public\spine-cpp
xcopy /E /I ..\spine-cpp\include Plugins\SpinePlugin\Source\SpinePlugin\Public\spine-cpp\include  || goto error
xcopy /E /I ..\spine-cpp\src Plugins\SpinePlugin\Source\SpinePlugin\Public\spine-cpp\src  || goto error
goto done

:error
@echo Couldn^'t setup spine-ue

:done