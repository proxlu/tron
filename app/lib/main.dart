import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: const WebViewScreen(),
      builder: (context, child) {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
        SystemChrome.setPreferredOrientations([
          DeviceOrientation.landscapeLeft,
          DeviceOrientation.landscapeRight,
        ]);
        return child!;
      },
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late InAppWebViewController webViewController;
  double progress = 0;
  Offset? _swipeStart;
  bool _swipeInProgress = false;
  final double _swipeThreshold = 50;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onPanStart: (details) {
          _swipeStart = details.globalPosition;
          _swipeInProgress = true;
        },
        onPanUpdate: (details) {
          if (!_swipeInProgress) return;
          
          final offset = details.globalPosition - _swipeStart!;
          if (offset.distance > _swipeThreshold) {
            _swipeInProgress = false; // Marca como processado
            _handleSwipe(offset);
          }
        },
        onPanEnd: (details) {
          _swipeInProgress = false;
        },
        child: Stack(
          children: [
            InAppWebView(
              initialUrlRequest: URLRequest(url: WebUri("http://vps57267.publiccloud.com.br:8181")),
              initialSettings: InAppWebViewSettings(
                transparentBackground: true,
                disableVerticalScroll: true,
                disableHorizontalScroll: false,
                supportZoom: false,
                javaScriptEnabled: true,
              ),
              onWebViewCreated: (controller) async {
                webViewController = controller;
                // Injeta código JavaScript para melhorar a resposta
                await controller.evaluateJavascript(source: '''
                  window.flutterSwipe = {
                    pendingDirection: null,
                    handleSwipe: function(direction) {
                      const event = new KeyboardEvent('keydown', {
                        key: direction,
                        keyCode: direction === 'ArrowUp' ? 38 : 
                                direction === 'ArrowDown' ? 40 :
                                direction === 'ArrowLeft' ? 37 : 39,
                        bubbles: true,
                        cancelable: true
                      });
                      document.dispatchEvent(event);
                    }
                  };
                ''');
              },
              onProgressChanged: (controller, progressValue) {
                setState(() => progress = progressValue / 100);
              },
            ),
            if (progress < 1.0)
              const Center(child: CircularProgressIndicator(color: Colors.white)),
          ],
        ),
      ),
    );
  }

  void _handleSwipe(Offset offset) async {
    final String direction;
    
    if (offset.dx.abs() > offset.dy.abs()) {
      direction = offset.dx > 0 ? 'ArrowRight' : 'ArrowLeft';
    } else {
      direction = offset.dy > 0 ? 'ArrowDown' : 'ArrowUp';
    }

    await webViewController.evaluateJavascript(source: '''
      flutterSwipe.handleSwipe('$direction');
    ''');
  }
}