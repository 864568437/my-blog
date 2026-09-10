@echo off
rem Footer 签名视频编码（需 ffmpeg；alpha webm 的关键参数是
rem -auto-alt-ref 0 + -metadata:s:v:0 alpha_mode=1，缺一不可）
rem 用法：encode.bat <ffmpeg路径>   （在 scripts/footer-signature 目录下运行）
set FF=%1
%FF% -y -framerate 30 -i frames-light/frame_%%04d.png -pix_fmt yuva420p -c:v libvpx-vp9 -auto-alt-ref 0 -lossless 1 -an -metadata:s:v:0 alpha_mode=1 ..\..\public\assets\images\xiaozhu-sig-light.webm
%FF% -y -framerate 30 -i frames-dark/frame_%%04d.png -pix_fmt yuva420p -c:v libvpx-vp9 -auto-alt-ref 0 -lossless 1 -an -metadata:s:v:0 alpha_mode=1 ..\..\public\assets\images\xiaozhu-sig-dark.webm
%FF% -y -framerate 30 -i frames-light/frame_%%04d.png -c:v qtrle -pix_fmt argb -an ..\..\public\assets\images\xiaozhu-sig-light.mov
%FF% -y -framerate 30 -i frames-dark/frame_%%04d.png -c:v qtrle -pix_fmt argb -an ..\..\public\assets\images\xiaozhu-sig-dark.mov
copy /y xiaozhu-sig-light-still.png ..\..\public\assets\images\ >nul
copy /y xiaozhu-sig-dark-still.png ..\..\public\assets\images\ >nul
echo done
