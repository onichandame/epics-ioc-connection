These shared libraries were built using

Epics Base 3.15.7 on Centos 7 with gcc 4.8.5, glibc 2.17

Readline support was turned off by setting `COMMANDLINE_LIBRARY=` in CONFIG_SITE.Common.linux-x86

The patchelf utility (from CentOS 7) was used to make the shared
libraries portable with the following commands:

  mv libCom.so libCom.so
  patchelf --set-soname libca.so libca.so
  patchelf --set-soname libCom.so libCom.so
  patchelf --set-rpath '$ORIGIN' libca.so
  patchelf --set-rpath '$ORIGIN' libCom.so
  patchelf --replace-needed libCom.so.3.15.7 libCom.so libca.so
