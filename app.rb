%w(sinatra compass slim sass).each{|g| require g}

configure do
  Compass.configuration do |config|
    config.project_path = File.dirname(__FILE__)
    config.sass_dir = 'views'
    config.images_dir = 'public/images'
    config.http_images_path = "/images"
  end

  set :slim, { format: :html5 }
  set :sass, Compass.sass_engine_options
  set :scss, Compass.sass_engine_options
end

get '/' do
  slim :index
end

not_found do
  redirect to('/')
end

get '/style.css' do
  sass :'sass/style', style: :compressed
end

error do
  'Oops. I think someone triped the power cord.'
end