import yt_dlp
import csv
import sys
import os
import requests
import time
import random
from datetime import datetime

# コマンドライン引数からURLを取得
if len(sys.argv) != 2:
    print("使用方法: python get_videos_simple.py <YouTubeチャンネルURL>")
    print("例: python get_videos_simple.py https://www.youtube.com/@usanko_ch")
    sys.exit(1)

CHANNEL_URL = sys.argv[1]

try:
    # より人間らしいUser-Agent
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    ]
    
    # yt-dlpの設定（シンプル版）
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,  # フラットな情報のみ取得（日付なし）
        'user_agent': random.choice(user_agents),
        'sleep_interval': 1,  # 短い待機時間
        'max_sleep_interval': 2,
        'retries': 3,
    }
    
    print(f"チャンネルURL: {CHANNEL_URL}")
    print("シンプル処理モード: 日付情報なし、基本情報のみ")
    print("バッチ間待機なし: 連続処理")
    
    # チャンネルURLに/videosを追加
    videos_url = CHANNEL_URL + "/videos"
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # まず全体の動画数を確認
        print("チャンネル情報を取得中...")
        info = ydl.extract_info(videos_url, download=False)
        
        if 'entries' not in info:
            print("チャンネル情報が見つかりませんでした。")
            sys.exit(1)
            
        # チャンネル名を取得
        channel_name = info.get('uploader', 'unknown_channel')
        clean_channel_name = channel_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
        
        # ファイル名設定
        CSV_FILE = f"{clean_channel_name}_simple_videos.csv"
        THUMBNAIL_FOLDER = f"{clean_channel_name}_thumbnails"
        
        print(f"チャンネル名: {channel_name}")
        print(f"CSVファイル名: {CSV_FILE}")
        print(f"サムネイルフォルダ名: {THUMBNAIL_FOLDER}")
        
        # サムネイル保存用フォルダを作成
        if not os.path.exists(THUMBNAIL_FOLDER):
            os.makedirs(THUMBNAIL_FOLDER)
            print(f"サムネイル保存フォルダ '{THUMBNAIL_FOLDER}' を作成しました。")
        
        # 全体の動画数を取得
        all_videos = [entry for entry in info['entries'] if entry]
        total_videos = len(all_videos)
        print(f"総動画数: {total_videos}")
        
        if total_videos == 0:
            print("このチャンネルには動画が見つかりませんでした。")
            sys.exit(1)
        
        # CSVファイルに書き込む準備
        with open(CSV_FILE, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["タイトル", "URL", "サムネイルファイル名", "作成物"])
            
            print(f"動画の情報とサムネイルを取得中...")
            print(f"開始時刻: {datetime.now().strftime('%H:%M:%S')}")
            
            successful_downloads = 0
            failed_downloads = 0
            
            for i, video in enumerate(all_videos, 1):
                title = video.get('title', 'タイトル不明')
                video_id = video.get('id', '')
                
                if video_id:
                    full_url = f"https://www.youtube.com/watch?v={video_id}"
                    # YouTubeのサムネイルURLを直接構築
                    thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                else:
                    full_url = ''
                    thumbnail_url = ''
                
                # サムネイルファイル名
                thumbnail_filename = ""
                if video_id:
                    try:
                        thumbnail_filename = f"{video_id}.jpg"
                        thumbnail_path = os.path.join(THUMBNAIL_FOLDER, thumbnail_filename)
                        
                        # 既にファイルが存在するかチェック
                        if os.path.exists(thumbnail_path):
                            print(f"⏭️ 既に存在: {thumbnail_filename}")
                            thumbnail_filename = f"{video_id}.jpg"
                            successful_downloads += 1
                        else:
                            # ランダムなUser-Agentを使用
                            headers = {
                                'User-Agent': random.choice(user_agents),
                                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                                'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',  # 日本語優先
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Connection': 'keep-alive',
                            }
                            
                            response = requests.get(thumbnail_url, headers=headers, timeout=30)
                            if response.status_code == 200:
                                with open(thumbnail_path, 'wb') as img_file:
                                    img_file.write(response.content)
                                print(f"✅ サムネイル保存: {thumbnail_filename}")
                                successful_downloads += 1
                            else:
                                # 高解像度が失敗した場合、標準解像度を試す
                                fallback_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                                response = requests.get(fallback_url, headers=headers, timeout=30)
                                if response.status_code == 200:
                                    with open(thumbnail_path, 'wb') as img_file:
                                        img_file.write(response.content)
                                    print(f"✅ サムネイル保存（標準解像度）: {thumbnail_filename}")
                                    successful_downloads += 1
                                else:
                                    print(f"❌ サムネイル取得失敗: {video_id} (Status: {response.status_code})")
                                    thumbnail_filename = ""
                                    failed_downloads += 1
                    except Exception as e:
                        print(f"❌ サムネイルダウンロードエラー: {video_id} - {e}")
                        thumbnail_filename = ""
                        failed_downloads += 1
                else:
                    print(f"⚠️ 動画IDなし")
                    failed_downloads += 1
                
                print(f"処理中: {i}/{total_videos} - {title}")
                writer.writerow([title, full_url, thumbnail_filename, ""])
                
                # 短い待機時間（連続処理のため短縮）
                if i < total_videos:
                    time.sleep(0.3)  # 0.3秒待機（さらに短縮）
            
            print(f"完了時刻: {datetime.now().strftime('%H:%M:%S')}")
        
        print(f"\n=== 完了！ ===")
        print(f"'{CSV_FILE}' に動画リストを保存しました。")
        print(f"サムネイルは '{THUMBNAIL_FOLDER}' フォルダに保存されました。")
        print(f"合計 {total_videos} 本の動画を処理しました。")
        print(f"成功: {successful_downloads} 本")
        print(f"失敗: {failed_downloads} 本")

except Exception as e:
    print(f"エラーが発生しました: {e}")
    print("詳細なエラー情報:")
    import traceback
    traceback.print_exc() 