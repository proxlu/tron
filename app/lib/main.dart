import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Para SystemChrome e orientação
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
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const WebViewScreen(),
      // Configuração para forçar landscape
      builder: (context, child) {
        // Bloqueia a orientação em landscape
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
  InAppWebViewController? webViewController;
  double progress = 0;

  @override
  void initState() {
    super.initState();
    // Configura a cor da barra de status
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Color.fromARGB(255, 255, 255, 255)), // Cor da barra de status
    );
    
    // Força landscape ao iniciar
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  @override
  void dispose() {
    // Restaura as orientações padrão ao sair
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 255, 255, 255), // Cor de fundo do Scaffold
      body: SafeArea(
        child: Stack(
          children: [
            // WebView
            InAppWebView(
              initialUrlRequest: URLRequest(url: WebUri("http://vps57267.publiccloud.com.br:8181")),
              initialSettings: InAppWebViewSettings(
                transparentBackground: true, // Torna o fundo transparente
                // Configurações adicionais para melhor experiência em landscape
                disableVerticalScroll: true,
                disableHorizontalScroll: false,
                supportZoom: false,
              ),
              onWebViewCreated: (controller) {
                webViewController = controller;
              },
              onProgressChanged: (controller, progressValue) {
                setState(() {
                  progress = progressValue / 100;
                });
              },
              onReceivedServerTrustAuthRequest: (controller, challenge) async {
                // Permite conexão com servidor não seguro (HTTP)
                return ServerTrustAuthResponse(action: ServerTrustAuthResponseAction.PROCEED);
              },
              onLoadStart: (controller, url) {
                setState(() {});
              },
              onLoadStop: (controller, url) {
                setState(() {});
              },
            ),

            // Círculo de carregamento
            if (progress < 1.0)
              Positioned.fill(
                child: Container(
                  color: const Color.fromARGB(255, 0, 0, 0),
                  child: Center(
                    child: SizedBox(
                      width: 70,
                      height: 70,
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        strokeWidth: 10.0,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}